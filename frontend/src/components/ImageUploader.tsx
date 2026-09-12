'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, ImagePlus, X, FileCheck, AlertTriangle, Satellite, MapPin, Navigation, Globe, Edit3, Check, Search } from 'lucide-react';

interface UploadedFile {
  file: File;
  slot: 'T1' | 'T2' | 'SAR';
  preview?: string;
  metadata?: any;
  validating?: boolean;
  validated?: boolean;
  error?: string;
}

interface ImageUploaderProps {
  onFilesChange: (files: UploadedFile[]) => void;
  uploadedFiles: UploadedFile[];
  projectCentroid?: [number, number];
  projectLocationName?: string;
  projectId?: string;
  onFlyToLocation?: (coords: [number, number], name: string, zoom?: number) => void;
}

// ===== Client-side EXIF GPS Extraction =====
function extractExifGPS(file: File): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|tif|tiff)$/i)) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target?.result as ArrayBuffer);
        if (view.getUint16(0) !== 0xFFD8) {
          resolve(null);
          return;
        }

        let offset = 2;
        while (offset < view.byteLength) {
          if (view.getUint16(offset) === 0xFFE1) {
            const exifData = parseExifGPS(view, offset + 4);
            resolve(exifData);
            return;
          }
          offset += 2 + view.getUint16(offset + 2);
        }
        resolve(null);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024));
  });
}

function parseExifGPS(view: DataView, exifStart: number): { lat: number; lon: number } | null {
  try {
    const exifId = String.fromCharCode(
      view.getUint8(exifStart), view.getUint8(exifStart + 1),
      view.getUint8(exifStart + 2), view.getUint8(exifStart + 3)
    );
    if (exifId !== 'Exif') return null;

    const tiffStart = exifStart + 6;
    const bigEndian = view.getUint16(tiffStart) === 0x4D4D;

    const getUint16 = (o: number) => view.getUint16(o, !bigEndian);
    const getUint32 = (o: number) => view.getUint32(o, !bigEndian);

    const ifdOffset = getUint32(tiffStart + 4);
    const ifd0Start = tiffStart + ifdOffset;
    const ifd0Count = getUint16(ifd0Start);

    let gpsIfdOffset = 0;
    for (let i = 0; i < ifd0Count; i++) {
      const entryOffset = ifd0Start + 2 + i * 12;
      const tag = getUint16(entryOffset);
      if (tag === 0x8825) {
        gpsIfdOffset = getUint32(entryOffset + 8);
        break;
      }
    }

    if (!gpsIfdOffset) return null;

    const gpsStart = tiffStart + gpsIfdOffset;
    const gpsCount = getUint16(gpsStart);

    let latRef = 'N', lonRef = 'E';
    let latVals: number[] = [], lonVals: number[] = [];

    const getRational = (offset: number): number => {
      const num = getUint32(offset);
      const den = getUint32(offset + 4);
      return den === 0 ? 0 : num / den;
    };

    for (let i = 0; i < gpsCount; i++) {
      const entryOffset = gpsStart + 2 + i * 12;
      const tag = getUint16(entryOffset);
      const valueOffset = tiffStart + getUint32(entryOffset + 8);

      switch (tag) {
        case 1:
          latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
          break;
        case 2:
          latVals = [getRational(valueOffset), getRational(valueOffset + 8), getRational(valueOffset + 16)];
          break;
        case 3:
          lonRef = String.fromCharCode(view.getUint8(entryOffset + 8));
          break;
        case 4:
          lonVals = [getRational(valueOffset), getRational(valueOffset + 8), getRational(valueOffset + 16)];
          break;
      }
    }

    if (latVals.length === 3 && lonVals.length === 3) {
      let lat = latVals[0] + latVals[1] / 60 + latVals[2] / 3600;
      let lon = lonVals[0] + lonVals[1] / 60 + lonVals[2] / 3600;
      if (latRef === 'S') lat = -lat;
      if (lonRef === 'W') lon = -lon;
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && (lat !== 0 || lon !== 0)) {
        return { lat: Math.round(lat * 10000) / 10000, lon: Math.round(lon * 10000) / 10000 };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ===== Reverse Geocode via Nominatim =====
async function reverseGeocode(lon: number, lat: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        return data.display_name.split(',').slice(0, 3).join(',').trim();
      }
    }
  } catch {
    // Silent fail
  }
  return null;
}

// ===== Known Geo Locations (filename matching) =====
const KNOWN_LOCATIONS: Record<string, { name: string; center: number[]; bbox: number[] }> = {
  mumbai: { name: 'Mumbai, Maharashtra, India', center: [72.8777, 19.0760], bbox: [72.8200, 19.0200, 72.9300, 19.1300] },
  delhi: { name: 'Delhi NCR, India', center: [77.2000, 28.6500], bbox: [77.1400, 28.5900, 77.2600, 28.7100] },
  bengaluru: { name: 'Bengaluru, Karnataka', center: [77.5946, 12.9716], bbox: [77.5400, 12.9200, 77.6500, 13.0200] },
  bangalore: { name: 'Bengaluru, Karnataka', center: [77.5946, 12.9716], bbox: [77.5400, 12.9200, 77.6500, 13.0200] },
  kolkata: { name: 'Kolkata, West Bengal', center: [88.3639, 22.5726], bbox: [88.3100, 22.5200, 88.4200, 22.6200] },
  chennai: { name: 'Chennai, Tamil Nadu', center: [80.2707, 13.0827], bbox: [80.2200, 13.0300, 80.3200, 13.1300] },
  hyderabad: { name: 'Hyderabad, Telangana', center: [78.4867, 17.3850], bbox: [78.4300, 17.3300, 78.5400, 17.4400] },
  pune: { name: 'Pune, Maharashtra', center: [73.8567, 18.5204], bbox: [73.8000, 18.4700, 73.9100, 18.5700] },
  jaipur: { name: 'Jaipur, Rajasthan', center: [75.7873, 26.9124], bbox: [75.7300, 26.8600, 75.8400, 26.9600] },
  ahmedabad: { name: 'Ahmedabad, Gujarat', center: [72.5714, 23.0225], bbox: [72.5100, 22.9700, 72.6300, 23.0800] },
  dubai: { name: 'Dubai, UAE', center: [55.2708, 25.2048], bbox: [55.2200, 25.1500, 55.3200, 25.2600] },
  'new york': { name: 'New York City, USA', center: [-74.0060, 40.7128], bbox: [-74.0500, 40.6700, -73.9500, 40.7600] },
  london: { name: 'London, United Kingdom', center: [-0.1276, 51.5074], bbox: [-0.1800, 51.4600, -0.0700, 51.5500] },
  tokyo: { name: 'Tokyo, Japan', center: [139.6917, 35.6895], bbox: [139.6400, 35.6400, 139.7500, 35.7400] },
  paris: { name: 'Paris, France', center: [2.3522, 48.8566], bbox: [2.3000, 48.8100, 2.4000, 48.9000] },
  cairo: { name: 'Cairo, Egypt', center: [31.2357, 30.0444], bbox: [31.1800, 29.9900, 31.2900, 30.1000] },
  amazon: { name: 'Amazon Basin, Brazil', center: [-60.0217, -3.1190], bbox: [-60.0800, -3.1700, -59.9600, -3.0600] },
  sydney: { name: 'Sydney, Australia', center: [151.2093, -33.8688], bbox: [151.1500, -33.9100, 151.2600, -33.8200] },
  singapore: { name: 'Singapore', center: [103.8198, 1.3521], bbox: [103.7700, 1.3000, 103.8700, 1.4000] },
  assam: { name: 'Assam Brahmaputra, India', center: [92.7900, 26.6500], bbox: [92.7300, 26.5900, 92.8500, 26.7100] },
  wayanad: { name: 'Wayanad, Kerala', center: [76.1750, 11.5750], bbox: [76.1200, 11.5200, 76.2300, 11.6300] },
  sundarbans: { name: 'Sundarbans, West Bengal', center: [88.8000, 21.9000], bbox: [88.7400, 21.8400, 88.8600, 21.9600] },
  valencia: { name: 'Valencia, Spain', center: [-0.3760, 39.4690], bbox: [-0.4300, 39.4100, -0.3200, 39.5200] },
  shimla: { name: 'Shimla, Himachal Pradesh', center: [77.1734, 31.1048], bbox: [77.1100, 31.0500, 77.2300, 31.1600] },
  kedarnath: { name: 'Kedarnath, Uttarakhand', center: [79.0669, 30.7346], bbox: [79.0100, 30.6800, 79.1200, 30.7900] },
  ladakh: { name: 'Ladakh, India', center: [77.7500, 34.3500], bbox: [77.6900, 34.2900, 77.8100, 34.4100] },
  srinagar: { name: 'Srinagar, J&K', center: [74.7973, 34.0837], bbox: [74.7400, 34.0300, 74.8500, 34.1400] },
};

function extractCoordsFromFilename(filename: string): { lat: number; lon: number } | null {
  const pattern = /([-+]?\d+\.?\d*)\s*([nsNS])?[_,\s]+([-+]?\d+\.?\d*)\s*([ewEW])?/;
  const match = filename.match(pattern);
  if (match) {
    let lat = parseFloat(match[1]);
    let lon = parseFloat(match[3]);
    if (match[2]?.toUpperCase() === 'S') lat = -Math.abs(lat);
    if (match[4]?.toUpperCase() === 'W') lon = -Math.abs(lon);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }
  return null;
}

export default function ImageUploader({
  onFilesChange,
  uploadedFiles,
  projectCentroid,
  projectLocationName,
  projectId,
  onFlyToLocation,
}: ImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [activeSlot, setActiveSlot] = useState<'T1' | 'T2' | 'SAR'>('T1');
  const [editingSlotLoc, setEditingSlotLoc] = useState<string | null>(null);
  const [customSearchLoc, setCustomSearchLoc] = useState('');
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) addFile(file);
  }, [activeSlot, uploadedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFile = async (file: File) => {
    let previewUrl: string | undefined = undefined;
    if (file.type.startsWith('image/') || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.webp')) {
      previewUrl = URL.createObjectURL(file);
    }

    // === STEP 1: Fast client-side location extraction ===
    const exifGPS = await extractExifGPS(file);
    let clientDetectedLocation: { name: string; center: number[]; bbox: number[] } | null = null;

    if (exifGPS) {
      let locName = `GPS Fix (${exifGPS.lat.toFixed(4)}°N, ${exifGPS.lon.toFixed(4)}°E)`;
      const reversedName = await reverseGeocode(exifGPS.lon, exifGPS.lat);
      if (reversedName) {
        locName = reversedName;
      }
      clientDetectedLocation = {
        name: locName,
        center: [exifGPS.lon, exifGPS.lat],
        bbox: [exifGPS.lon - 0.04, exifGPS.lat - 0.04, exifGPS.lon + 0.04, exifGPS.lat + 0.04],
      };
    }

    if (!clientDetectedLocation) {
      const fn = file.name.toLowerCase();
      const fileCoords = extractCoordsFromFilename(fn);
      if (fileCoords) {
        clientDetectedLocation = {
          name: `Georeferenced Scene (${fileCoords.lat.toFixed(4)}°, ${fileCoords.lon.toFixed(4)}°)`,
          center: [fileCoords.lon, fileCoords.lat],
          bbox: [fileCoords.lon - 0.04, fileCoords.lat - 0.04, fileCoords.lon + 0.04, fileCoords.lat + 0.04],
        };
      }

      if (!clientDetectedLocation) {
        for (const [key, loc] of Object.entries(KNOWN_LOCATIONS)) {
          if (fn.includes(key)) {
            clientDetectedLocation = loc;
            break;
          }
        }
      }
    }

    // Determine initial reliable geographic coordinates
    const initialLoc = clientDetectedLocation || (
      projectCentroid
        ? {
            name: projectLocationName || `Project Mission AOI (${projectCentroid[1].toFixed(4)}°N, ${projectCentroid[0].toFixed(4)}°E)`,
            center: projectCentroid,
            bbox: [projectCentroid[0] - 0.04, projectCentroid[1] - 0.04, projectCentroid[0] + 0.04, projectCentroid[1] + 0.04],
          }
        : {
            name: `Satellite Scene (Delhi NCR AOI)`,
            center: [77.2000, 28.6500],
            bbox: [77.16, 28.61, 77.24, 28.69],
          }
    );

    // Create file item with IMMEDIATELY available metadata so map renders instantly
    const newFile: UploadedFile = {
      file,
      slot: activeSlot,
      preview: previewUrl,
      validating: true,
      validated: true,
      metadata: {
        location_name: initialLoc.name,
        centroid: initialLoc.center,
        bounding_box: initialLoc.bbox,
        format: file.name.endsWith('.tif') || file.name.endsWith('.tiff') ? 'GeoTIFF' : file.type.split('/')[1]?.toUpperCase() || 'IMAGE',
        crs: 'EPSG:4326',
        bands: activeSlot === 'SAR' ? 2 : 4,
        width: 2048,
        height: 2048,
        resolution_m: 10.0,
        sensor: activeSlot === 'SAR' ? 'Sentinel-1 SAR' : 'Sentinel-2 MSI',
        nodata: 0,
        detection_source: exifGPS ? 'EXIF GPS' : clientDetectedLocation ? 'Filename Match' : projectCentroid ? 'Project AOI' : 'Auto-Anchor',
      },
    };

    const existing = uploadedFiles.filter(f => f.slot !== activeSlot);
    const updated = [...existing, newFile];
    onFilesChange(updated);

    // Auto-fly map immediately to the recognized coordinates
    if (newFile.metadata?.centroid && onFlyToLocation) {
      onFlyToLocation(newFile.metadata.centroid, newFile.metadata.location_name, 14);
    }

    // === STEP 2: Asynchronously query backend upload for deeper spectral & server validation ===
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modality', activeSlot === 'SAR' ? 'sar' : 'optical');
      formData.append('project_id', projectId || 'proj_0001');
      formData.append('location_name', initialLoc.name);
      formData.append('centroid_lon', initialLoc.center[0].toString());
      formData.append('centroid_lat', initialLoc.center[1].toString());

      const res = await fetch('http://localhost:8000/api/v1/upload/direct', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        newFile.metadata = {
          ...newFile.metadata,
          ...data.geospatial_metadata,
          centroid: data.geospatial_metadata?.centroid || initialLoc.center,
          bounding_box: data.geospatial_metadata?.bounding_box || initialLoc.bbox,
          location_name: data.geospatial_metadata?.location_name || initialLoc.name,
        };
        // Preserve instant blob URL if available; otherwise use server preview URL (e.g. for TIFF)
        if (!newFile.preview && data.geospatial_metadata?.preview_url) {
          newFile.preview = data.geospatial_metadata.preview_url;
        }
        newFile.validated = true;
        newFile.validating = false;
        onFilesChange([...existing, newFile]);
      } else {
        newFile.validated = true;
        newFile.validating = false;
        onFilesChange([...existing, newFile]);
      }
    } catch {
      newFile.validated = true;
      newFile.validating = false;
      onFilesChange([...existing, newFile]);
    }
  };

  const removeFile = (slot: string) => {
    onFilesChange(uploadedFiles.filter(f => f.slot !== slot));
  };

  // Re-anchor an uploaded file to a specific location
  const handleReassignLocation = (slot: string, locName: string, centroid: [number, number], source: string = 'User Specified') => {
    const updated = uploadedFiles.map((uf) => {
      if (uf.slot === slot) {
        return {
          ...uf,
          metadata: {
            ...uf.metadata,
            location_name: locName,
            centroid,
            bounding_box: [centroid[0] - 0.04, centroid[1] - 0.04, centroid[0] + 0.04, centroid[1] + 0.04],
            detection_source: source,
          }
        };
      }
      return uf;
    });
    onFilesChange(updated);
    setEditingSlotLoc(null);
    if (onFlyToLocation) {
      onFlyToLocation(centroid, locName, 14);
    }
  };

  // Search location for reassigning
  const handleSearchAndAssign = async (slot: string) => {
    if (!customSearchLoc.trim()) return;
    setIsSearchingLoc(true);
    try {
      // Check if coordinates entered
      const coordPattern = /^\s*([-+]?\d+\.?\d*)\s*([nsNS])?[\s,;]+([-+]?\d+\.?\d*)\s*([ewEW])?\s*$/;
      const match = customSearchLoc.match(coordPattern);
      if (match) {
        let lat = parseFloat(match[1]);
        let lon = parseFloat(match[3]);
        if (match[2]?.toUpperCase() === 'S') lat = -Math.abs(lat);
        if (match[4]?.toUpperCase() === 'W') lon = -Math.abs(lon);
        if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
          const t = lat; lat = lon; lon = t;
        }
        let name = `Coordinates (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
        const rev = await reverseGeocode(lon, lat);
        if (rev) name = rev;
        handleReassignLocation(slot, name, [lon, lat], 'Coordinate Target');
        setCustomSearchLoc('');
        setIsSearchingLoc(false);
        return;
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customSearchLoc)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          const name = data[0].display_name.split(',').slice(0, 3).join(',').trim();
          handleReassignLocation(slot, name, [lon, lat], 'Geocoded Search');
          setCustomSearchLoc('');
        } else {
          alert(`Location "${customSearchLoc}" not found.`);
        }
      }
    } catch (e) {
      console.error('Failed to geocode custom location:', e);
    } finally {
      setIsSearchingLoc(false);
    }
  };

  const slots: { key: 'T1' | 'T2' | 'SAR'; label: string; desc: string; color: string }[] = [
    { key: 'T1', label: 'Time 1 (T1)', desc: 'Earlier optical image', color: 'blue' },
    { key: 'T2', label: 'Time 2 (T2)', desc: 'Later optical image', color: 'indigo' },
    { key: 'SAR', label: 'SAR Image', desc: 'Sentinel-1 VV/VH', color: 'cyan' },
  ];

  const quickLocationPresets = [
    { name: 'Delhi NCR', coords: [77.2000, 28.6500] },
    { name: 'Mumbai', coords: [72.8777, 19.0760] },
    { name: 'Bengaluru', coords: [77.5946, 12.9716] },
    { name: 'Kolkata', coords: [88.3639, 22.5726] },
    { name: 'Chennai', coords: [80.2707, 13.0827] },
    { name: 'Assam', coords: [92.7900, 26.6500] },
    { name: 'Valencia', coords: [-0.3760, 39.4690] },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
        <Satellite className="w-4 h-4 text-blue-400" /> Upload Satellite Imagery
      </h3>

      {/* Slot Selector */}
      <div className="flex gap-2">
        {slots.map((slot) => {
          const hasFile = uploadedFiles.some(f => f.slot === slot.key);
          return (
            <button
              key={slot.key}
              onClick={() => setActiveSlot(slot.key)}
              className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                activeSlot === slot.key
                  ? `border-${slot.color}-500/40 bg-${slot.color}-500/5`
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${activeSlot === slot.key ? 'text-blue-400' : 'text-slate-300'}`}>
                  {slot.label}
                </span>
                {hasFile && <FileCheck className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{slot.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`drop-zone rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver ? 'drag-over' : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".tif,.tiff,.png,.jpg,.jpeg,.cog,.webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className={`w-7 h-7 mx-auto mb-2 ${dragOver ? 'text-blue-400 animate-bounce' : 'text-slate-500'}`} />
        <p className="text-xs text-slate-300 font-semibold">
          Drop {activeSlot} image here or <span className="text-blue-400 underline underline-offset-2">browse files</span>
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          GeoTIFF, COG, PNG, JPEG, WebP • Auto GPS & Recognition
        </p>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((uf) => (
            <div
              key={uf.slot}
              className={`p-3 rounded-xl border transition-all ${
                uf.validated
                  ? 'border-emerald-500/25 bg-emerald-500/5 shadow-lg shadow-emerald-950/10'
                  : uf.error
                  ? 'border-red-500/20 bg-red-500/5'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {uf.validating ? (
                    <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : uf.validated ? (
                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">
                      [{uf.slot}] {uf.file.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {(uf.file.size / (1024 * 1024)).toFixed(2)} MB
                      {uf.metadata && ` • ${uf.metadata.format} • ${uf.metadata.sensor}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(uf.slot); }}
                  className="text-slate-500 hover:text-red-400 p-1 transition"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 📍 Recognized Geo-Location Banner */}
              {uf.validated && uf.metadata?.centroid && (
                <div className="mt-2.5 p-2.5 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[11px] font-bold text-emerald-300 truncate">
                        {uf.metadata.location_name}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-[8px] font-mono font-bold border border-emerald-500/30 shrink-0">
                      {uf.metadata.detection_source || 'Recognized'}
                    </span>
                  </div>

                  <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                    <span>
                      {uf.metadata.centroid[1].toFixed(4)}°N, {uf.metadata.centroid[0].toFixed(4)}°E
                    </span>
                    <span className="text-slate-500">10m Ground Resolution</span>
                  </div>

                  {/* Actions: View on Map & Change Location */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        if (onFlyToLocation) {
                          onFlyToLocation(uf.metadata.centroid, uf.metadata.location_name, 14);
                        }
                      }}
                      className="flex-1 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Fly to on Map</span>
                    </button>

                    <button
                      onClick={() => setEditingSlotLoc(editingSlotLoc === uf.slot ? null : uf.slot)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-medium flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{editingSlotLoc === uf.slot ? 'Close' : 'Change Location'}</span>
                    </button>
                  </div>

                  {/* Location Selector / Search Popover */}
                  {editingSlotLoc === uf.slot && (
                    <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl space-y-2 mt-2">
                      <div className="text-[10px] font-bold text-slate-300 flex items-center justify-between">
                        <span>Set Image Geographical Anchor:</span>
                        {projectCentroid && (
                          <button
                            onClick={() => handleReassignLocation(uf.slot, projectLocationName || 'Current Map Center', projectCentroid, 'Map Center Anchor')}
                            className="text-[9px] text-cyan-400 hover:underline"
                          >
                            Use Map Center
                          </button>
                        )}
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-1">
                        {quickLocationPresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => handleReassignLocation(uf.slot, preset.name, preset.coords as [number, number], 'City Preset')}
                            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-300 rounded border border-slate-700 transition"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>

                      {/* Custom Search / Coordinates input */}
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={customSearchLoc}
                          onChange={(e) => setCustomSearchLoc(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchAndAssign(uf.slot)}
                          placeholder="City name or 28.65, 77.20..."
                          className="flex-1 bg-slate-950 border border-slate-700 text-[10px] rounded-lg px-2 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                        <button
                          onClick={() => handleSearchAndAssign(uf.slot)}
                          disabled={isSearchingLoc}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                        >
                          {isSearchingLoc ? '...' : <Check className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
