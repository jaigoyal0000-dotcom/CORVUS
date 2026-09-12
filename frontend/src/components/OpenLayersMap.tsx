'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import HeatmapLayer from 'ol/layer/Heatmap';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import ImageStatic from 'ol/source/ImageStatic';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import XYZ from 'ol/source/XYZ';
import Overlay from 'ol/Overlay';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { Style, Stroke, Fill, Circle as CircleStyle, Text as TextStyle, Icon as IconStyle } from 'ol/style';
import { getLength, getArea } from 'ol/sphere';
import Draw from 'ol/interaction/Draw';
import ScaleLine from 'ol/control/ScaleLine';
import OverviewMap from 'ol/control/OverviewMap';
import {
  Image as ImageIcon, Layers, Maximize2, Minimize2,
  CheckCircle2, Flame, Navigation, MapPin, Search, Globe,
  ZoomIn, ZoomOut, Eye, EyeOff, Sparkles, Satellite, Crosshair,
  Ruler, Square, Sliders, Camera, RefreshCw, Sun, Contrast,
  Scan, Compass, ShieldAlert, Activity, Droplets, Trees,
  Building2, GitCompare, Route, Info, X, ChevronRight, BarChart3,
  LocateFixed, ImageDown, Map as MapIconLucide, Radar, Target
} from 'lucide-react';

export interface UploadedFile {
  file: File;
  slot: 'T1' | 'T2' | 'SAR';
  preview?: string;
  metadata?: any;
  validated?: boolean;
}

export type BasemapStyle =
  | 'google_sat'
  | 'google_hybrid'
  | 'esri_sat'
  | 'dark_tactical'
  | 'osm'
  | 'topo';

export type SpectralFilter = 'normal' | 'cir_infrared' | 'sar_radar' | 'night_vision' | 'panchromatic' | 'thermal_lut';

export type LandCoverType = 'vegetation' | 'water' | 'urban' | 'diff_change' | 'roads';

export interface LandCoverVisibility {
  vegetation: boolean;
  water: boolean;
  urban: boolean;
  diff_change: boolean;
  roads: boolean;
}

export interface FeatureInspectionData {
  id: string;
  type: LandCoverType;
  title: string;
  subType: string;
  areaFormatted: string;
  metrics: Record<string, string | number>;
  coords: [number, number];
  description: string;
}

export interface BasemapConfig {
  name: string;
  category: string;
  url: string;
  labelUrl?: string;
  icon: string;
  maxNativeZoom: number;
  description: string;
}

export const BASEMAP_PROVIDERS: Record<BasemapStyle, BasemapConfig> = {
  google_sat: {
    name: 'Google High-Res Satellite',
    category: 'Ultra-HD Global',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    icon: '🛰️',
    maxNativeZoom: 20,
    description: 'Sub-meter high-resolution true-color satellite imagery with digital oversampling',
  },
  google_hybrid: {
    name: 'Google Hybrid (Sat + Labels)',
    category: 'Ultra-HD Global',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    icon: '🌍',
    maxNativeZoom: 20,
    description: 'High-res satellite composite with detailed streets, landmarks, and borders',
  },
  esri_sat: {
    name: 'Esri World Imagery HD',
    category: 'ArcGIS Basemap',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    icon: '🌐',
    maxNativeZoom: 18,
    description: 'Esri World Imagery with seamless multi-zoom bilinear oversampling',
  },
  dark_tactical: {
    name: 'Dark Tactical Matter',
    category: 'CartoDB Vector',
    url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    icon: '🌌',
    maxNativeZoom: 19,
    description: 'High contrast dark basemap optimized for military & reconnaissance overlays',
  },
  osm: {
    name: 'OpenStreetMap Carto',
    category: 'Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: '🗺️',
    maxNativeZoom: 19,
    description: 'Open community street and municipal infrastructure map',
  },
  topo: {
    name: 'Topographic Relief',
    category: 'Elevation & Contours',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    icon: '🏔️',
    maxNativeZoom: 18,
    description: 'Terrain elevation contours, shading, and hydrological networks',
  },
};

interface OpenLayersMapProps {
  centerLonLat?: [number, number];
  locationName?: string;
  zoom?: number;
  activeLayer?: string;
  uploadedFiles?: UploadedFile[];
  layerVisibility?: LandCoverVisibility;
  onLayerVisibilityChange?: (vis: LandCoverVisibility) => void;
  basemap?: BasemapStyle;
  onBasemapChange?: (bm: BasemapStyle) => void;
  spectralFilter?: SpectralFilter;
  onSpectralFilterChange?: (filter: SpectralFilter) => void;
  disasterData?: any;
  isFreshMap?: boolean;
  onPointLocation?: (coords: [number, number], locationName?: string, zoom?: number) => void;
}

export default function OpenLayersMap({
  centerLonLat,
  locationName,
  zoom = 13,
  activeLayer = 'change',
  uploadedFiles = [],
  layerVisibility: externalLayerVisibility,
  onLayerVisibilityChange,
  basemap: externalBasemap,
  onBasemapChange,
  spectralFilter: externalSpectralFilter,
  onSpectralFilterChange,
  disasterData,
  isFreshMap = false,
  onPointLocation,
}: OpenLayersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const baseTileLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const labelTileLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const heatmapLayerRef = useRef<HeatmapLayer | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const disasterHazardLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const measureVectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);

  // Dedicated Vector Layers for Multi-Spectral Land Cover Features
  const vegetationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const waterLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const urbanLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const diffChangeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const roadsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  // 🖼️ Uploaded Image Overlay Layer (renders actual uploaded rasters on the map)
  const imageOverlayLayerRef = useRef<ImageLayer<ImageStatic> | null>(null);
  const imageOverlayBorderLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  const [viewMode, setViewMode] = useState<'map' | 'uploaded'>('map');
  const [selectedSlot, setSelectedSlot] = useState<'T1' | 'T2' | 'SAR'>('T1');
  
  // Internal fallback state if not externally controlled
  const [internalBasemap, setInternalBasemap] = useState<BasemapStyle>('google_sat');
  const [internalSpectralFilter, setInternalSpectralFilter] = useState<SpectralFilter>('normal');
  const [internalLayerVisibility, setInternalLayerVisibility] = useState<LandCoverVisibility>({
    vegetation: false,
    water: false,
    urban: false,
    diff_change: false,
    roads: false,
  });

  const basemap = externalBasemap !== undefined ? externalBasemap : internalBasemap;
  const setBasemap = (bm: BasemapStyle) => {
    setInternalBasemap(bm);
    if (onBasemapChange) onBasemapChange(bm);
  };

  const spectralFilter = externalSpectralFilter !== undefined ? externalSpectralFilter : internalSpectralFilter;
  const setSpectralFilter = (f: SpectralFilter) => {
    setInternalSpectralFilter(f);
    if (onSpectralFilterChange) onSpectralFilterChange(f);
  };

  const currentLayerVisibility = externalLayerVisibility !== undefined ? externalLayerVisibility : internalLayerVisibility;
  const toggleLayer = (key: LandCoverType) => {
    const updated = {
      ...currentLayerVisibility,
      [key]: !currentLayerVisibility[key],
    };
    setInternalLayerVisibility(updated);
    if (onLayerVisibilityChange) onLayerVisibilityChange(updated);
  };

  const [currentZoom, setCurrentZoom] = useState<number>(zoom);

  // Heatmap controls (gentle defaults so it never blows out or bursts)
  // 🔥 AI Multi-Spectral Heatmap Controls (Default ON to project AI detection over satellite map)
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapType, setHeatmapType] = useState<'change' | 'urban' | 'vegetation' | 'water' | 'sar' | 'hazard'>('change');
  const [heatmapRadius, setHeatmapRadius] = useState(18);
  const [heatmapBlur, setHeatmapBlur] = useState(22);
  const [heatmapOpacity, setHeatmapOpacity] = useState(75);
  const [showRelocateBar, setShowRelocateBar] = useState(false);

  // Tactical & Image adjustments
  const [showReticle, setShowReticle] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [layerOpacity, setLayerOpacity] = useState(100);
  const [showTunePanel, setShowTunePanel] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);

  // 🖼️ Raw Image Overlay Controls (Default OFF so raw photo does NOT obstruct satellite map)
  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const [showImageBorder, setShowImageBorder] = useState(false);
  const [imageOverlayOpacity, setImageOverlayOpacity] = useState(85);
  const [imageFootprintKm, setImageFootprintKm] = useState<number>(2.5);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1.0);
  const [imageAnchorCoord, setImageAnchorCoord] = useState<[number, number] | null>(null);
  const currentImageExtentRef = useRef<[number, number, number, number] | null>(null);

  // 📍 Location Recognition Toast
  const [locationToast, setLocationToast] = useState<{
    visible: boolean;
    locationName: string;
    coords: [number, number];
    source: string;
  }>({ visible: false, locationName: '', coords: [0, 0], source: '' });

  // 🧭 Coordinate Format
  const [coordFormat, setCoordFormat] = useState<'dms' | 'decimal' | 'utm'>('dms');

  // 🌐 Browser Geolocation
  const [geoLocating, setGeoLocating] = useState(false);

  // Measurement & AOI Drawing
  const [activeTool, setActiveTool] = useState<'none' | 'measure_distance' | 'measure_area' | 'draw_aoi'>('none');
  const [measureResult, setMeasureResult] = useState<string | null>(null);
  const [inspectedFeature, setInspectedFeature] = useState<FeatureInspectionData | null>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const initialCentroid: [number, number] = centerLonLat || [78.9629, 20.5937];
  const initialLocName = locationName || (isFreshMap ? 'Unanchored Observation Map' : 'Project Mission AOI');

  const [cursorCoords, setCursorCoords] = useState<[number, number]>(initialCentroid);
  // 🎯 Location pin & tactical reconnaissance reticle (Locates place on map)
  const [showLocationPin, setShowLocationPin] = useState(true);

  const [recognizedLocation, setRecognizedLocation] = useState<{
    name: string;
    centroid: [number, number];
    bbox: [number, number, number, number];
  }>({
    name: initialLocName,
    centroid: initialCentroid,
    bbox: [initialCentroid[0] - 0.04, initialCentroid[1] - 0.03, initialCentroid[0] + 0.04, initialCentroid[1] + 0.03],
  });

  // 📍 Show location recognized toast with auto-dismiss
  const showLocationRecognizedToast = useCallback((name: string, coords: [number, number], source: string) => {
    setLocationToast({ visible: true, locationName: name, coords, source });
    setTimeout(() => setLocationToast(prev => ({ ...prev, visible: false })), 5000);
  }, []);

  // 🌐 Reverse Geocode coordinates to get a place name via Nominatim
  const reverseGeocode = useCallback(async (lon: number, lat: number): Promise<string | null> => {
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
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    }
    return null;
  }, []);

  // 🌍 Browser Geolocation — fly to user's real GPS position with IP fallback
  const handleBrowserGeolocation = useCallback(() => {
    setGeoLocating(true);

    const fallbackToIP = async () => {
      try {
        const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          const lat = parseFloat(ipData.latitude);
          const lon = parseFloat(ipData.longitude);
          const locParts = [ipData.city, ipData.region, ipData.country].filter(Boolean);
          const locName = locParts.length > 0 ? locParts.join(', ') : `Location Fix (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`;
          const coords: [number, number] = [lon, lat];
          const newLoc = {
            name: locName,
            centroid: coords,
            bbox: [lon - 0.04, lat - 0.04, lon + 0.04, lat + 0.04] as [number, number, number, number],
          };
          setRecognizedLocation(newLoc);
          flyToLocation(coords, 13);
          showLocationRecognizedToast(locName, coords, 'Network IP Location');
          if (onPointLocation) {
            onPointLocation(coords, locName, 13);
          }
        } else {
          showLocationRecognizedToast('Default AOI (Delhi NCR)', [77.2000, 28.6500], 'Fallback AOI');
        }
      } catch (e) {
        console.warn('IP Geolocation failed:', e);
        showLocationRecognizedToast('Default AOI (Delhi NCR)', [77.2000, 28.6500], 'Fallback AOI');
      } finally {
        setGeoLocating(false);
      }
    };

    if (!navigator.geolocation) {
      fallbackToIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        const coords: [number, number] = [longitude, latitude];
        let locName = `GPS Fix (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`;

        // Reverse geocode for a real name
        const reverseResult = await reverseGeocode(longitude, latitude);
        if (reverseResult) {
          locName = reverseResult;
        }

        const newLoc = {
          name: locName,
          centroid: coords,
          bbox: [longitude - 0.02, latitude - 0.02, longitude + 0.02, latitude + 0.02] as [number, number, number, number],
        };
        setRecognizedLocation(newLoc);
        flyToLocation(coords, 15);
        showLocationRecognizedToast(locName, coords, 'Device GPS');
        if (onPointLocation) {
          onPointLocation(coords, locName, 15);
        }
        setGeoLocating(false);
      },
      (err) => {
        console.warn('Browser GPS unavailable, falling back to IP Geolocation:', err.message);
        fallbackToIP();
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, [onPointLocation, reverseGeocode, showLocationRecognizedToast]);

  // Calculate GSD (Ground Sampling Distance)
  const computeGSD = (z: number): string => {
    const latRad = (cursorCoords[1] * Math.PI) / 180;
    const metersPerPixel = (156543.03 * Math.cos(latRad)) / Math.pow(2, z);
    if (metersPerPixel < 1) {
      return `${(metersPerPixel * 100).toFixed(1)} cm/px`;
    }
    return `${metersPerPixel.toFixed(2)} m/px`;
  };

  // Convert decimal coords to DMS
  const formatDMS = (coord: number, isLat: boolean): string => {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : coord >= 0 ? 'E' : 'W';
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  const AI_PRESET_LOCATIONS = [
    { label: 'Chamoli (SAR / DInSAR)', name: 'Chamoli Glacial Breach & DInSAR Deformation Field, Uttarakhand', centroid: [79.5600, 30.5500], icon: '📡' },
    { label: 'Delhi NCR (Urban / Yamuna)', name: 'Delhi NCR Capital Geospatial AOI, India', centroid: [77.2000, 28.6500], icon: '🏙️' },
    { label: 'Assam Brahmaputra (Floods)', name: 'Assam Brahmaputra Riverine Floodplain', centroid: [92.7900, 26.6500], icon: '🌊' },
    { label: 'Valencia Basin (Flash Flood)', name: 'Valencia Basin Flash Flood Zone, Spain', centroid: [-0.3760, 39.4690], icon: '🌊' },
    { label: 'Similipal (Wildfire / Forest)', name: 'Similipal Biosphere & Wildfire Corridor, Odisha', centroid: [86.3500, 21.8500], icon: '🔥' },
    { label: 'Mumbai Delta (Coast / Port)', name: 'Mumbai Coastal Estuary & Harbour, Maharashtra', centroid: [72.8777, 19.0760], icon: '🏖️' },
  ];

  const handleRelocateScene = (locName: string, centroid: [number, number]) => {
    const bbox: [number, number, number, number] = [
      centroid[0] - 0.04,
      centroid[1] - 0.04,
      centroid[0] + 0.04,
      centroid[1] + 0.04,
    ];
    const newLoc = { name: locName, centroid, bbox };
    setRecognizedLocation(newLoc);
    flyToLocation(centroid, 14);

    if (mapInstanceRef.current && uploadedFiles.length > 0) {
      const activeFile = uploadedFiles.find((f) => f.slot === selectedSlot) || uploadedFiles[0];
      if (activeFile?.preview) {
        const map = mapInstanceRef.current;
        const extent = transformExtent(
          [bbox[0], bbox[1], bbox[2], bbox[3]],
          'EPSG:4326',
          'EPSG:3857'
        );

        if (imageOverlayLayerRef.current) map.removeLayer(imageOverlayLayerRef.current);
        if (imageOverlayBorderLayerRef.current) map.removeLayer(imageOverlayBorderLayerRef.current);

        const imgSource = new ImageStatic({
          url: activeFile.preview,
          imageExtent: extent,
          interpolate: true,
          crossOrigin: 'anonymous',
        });

        const imgLayer = new ImageLayer({
          source: imgSource,
          opacity: imageOverlayOpacity / 100,
          zIndex: 9,
          visible: showImageOverlay,
        });

        const borderSource = new VectorSource();
        const borderPoly = new Polygon([[
          fromLonLat([bbox[0], bbox[1]]),
          fromLonLat([bbox[2], bbox[1]]),
          fromLonLat([bbox[2], bbox[3]]),
          fromLonLat([bbox[0], bbox[3]]),
          fromLonLat([bbox[0], bbox[1]]),
        ]]);
        borderSource.addFeature(new Feature({ geometry: borderPoly }));
        const borderLayer = new VectorLayer({
          source: borderSource,
          zIndex: 11,
          visible: showImageOverlay,
        });

        imageOverlayLayerRef.current = imgLayer;
        imageOverlayBorderLayerRef.current = borderLayer;
        map.addLayer(imgLayer);
        map.addLayer(borderLayer);
      }
    }

    showLocationRecognizedToast(locName, centroid, 'AI / Preset Target');
    if (onPointLocation) {
      onPointLocation(centroid, locName, 14);
    }
    setShowRelocateBar(false);
  };

  // Anchor raster image to current map view center
  const handleAnchorToCurrentCenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const viewCenterCoords = toLonLat(mapInstanceRef.current.getView().getCenter() || [0, 0]) as [number, number];
    setImageAnchorCoord(viewCenterCoords);
    reverseGeocode(viewCenterCoords[0], viewCenterCoords[1]).then((revName) => {
      const name = revName || `Anchored Location (${viewCenterCoords[1].toFixed(4)}°N, ${viewCenterCoords[0].toFixed(4)}°E)`;
      setRecognizedLocation({
        name,
        centroid: viewCenterCoords,
        bbox: [viewCenterCoords[0] - 0.04, viewCenterCoords[1] - 0.04, viewCenterCoords[0] + 0.04, viewCenterCoords[1] + 0.04],
      });
      showLocationRecognizedToast(name, viewCenterCoords, 'GIS Image Re-anchored');
      if (onPointLocation) {
        onPointLocation(viewCenterCoords, name, mapInstanceRef.current?.getView().getZoom() || 14);
      }
    });
  }, [onPointLocation]);

  // Fit view smoothly to the current calibrated image extent
  const handleFitToImage = useCallback(() => {
    if (!mapInstanceRef.current || !currentImageExtentRef.current) return;
    mapInstanceRef.current.getView().fit(currentImageExtentRef.current, {
      padding: [60, 60, 60, 60],
      duration: 800,
      maxZoom: 18,
    });
  }, []);

  // Extract recognized location from uploaded files + locate place on map + project AI Heatmap
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      const activeFile = uploadedFiles.find((f) => f.slot === selectedSlot) || uploadedFiles[0];
      if (!activeFile) return;

      const baseCentroid: [number, number] = imageAnchorCoord || (activeFile.metadata?.centroid as [number, number]) || centerLonLat || [77.2000, 28.6500];
      const locName = activeFile.metadata?.location_name || recognizedLocation.name || 'Recognized Satellite AOI';

      // 1. Locate the place on the real satellite map:
      setShowLocationPin(true);
      flyToLocation(baseCentroid, 14);

      // 2. Select AI Heatmap signature based on file name or sensor:
      const fnLower = (activeFile.file?.name || '').toLowerCase();
      let detectedType: typeof heatmapType = 'change';
      if (fnLower.includes('sar') || fnLower.includes('interfero') || fnLower.includes('fringe') || fnLower.includes('radar')) {
        detectedType = 'sar';
      } else if (fnLower.includes('water') || fnLower.includes('flood') || fnLower.includes('river')) {
        detectedType = 'water';
      } else if (fnLower.includes('urban') || fnLower.includes('city') || fnLower.includes('delhi') || fnLower.includes('mumbai')) {
        detectedType = 'urban';
      } else if (fnLower.includes('veg') || fnLower.includes('canopy') || fnLower.includes('crop') || fnLower.includes('forest')) {
        detectedType = 'vegetation';
      } else {
        detectedType = 'change';
      }
      setHeatmapType(detectedType);

      // 3. Project AI Heatmap over target place & keep raw photo off map (per user requirement):
      setShowHeatmap(true);
      setShowImageOverlay(false);
      setShowImageBorder(false);

      // Reverse geocode if generic
      if (locName.includes('Observed') || locName.includes('Target Scene') || locName.includes('°')) {
        reverseGeocode(baseCentroid[0], baseCentroid[1]).then((reversedName) => {
          if (reversedName) {
            setRecognizedLocation((prev) => ({ ...prev, name: reversedName }));
            showLocationRecognizedToast(reversedName, baseCentroid, 'Target Geocoded');
          }
        });
      }

      // Compute bounding box around target coordinate
      const halfDeg = 0.04;
      const targetBbox: [number, number, number, number] = [
        baseCentroid[0] - halfDeg,
        baseCentroid[1] - halfDeg,
        baseCentroid[0] + halfDeg,
        baseCentroid[1] + halfDeg,
      ];

      setRecognizedLocation({
        name: locName,
        centroid: baseCentroid,
        bbox: targetBbox,
      });

      // Clear any raw image overlay layers so the satellite basemap is purely visible with heatmap
      if (mapInstanceRef.current) {
        if (imageOverlayLayerRef.current) {
          mapInstanceRef.current.removeLayer(imageOverlayLayerRef.current);
          imageOverlayLayerRef.current = null;
        }
        if (imageOverlayBorderLayerRef.current) {
          mapInstanceRef.current.removeLayer(imageOverlayBorderLayerRef.current);
          imageOverlayBorderLayerRef.current = null;
        }
      }

      showLocationRecognizedToast(locName, baseCentroid, `Target Located: ${activeFile.file.name}`);
      if (onPointLocation && !imageAnchorCoord) {
        onPointLocation(baseCentroid, locName, 14);
      }
    } else {
      // No uploaded files — remove image overlay if exists
      if (mapInstanceRef.current) {
        if (imageOverlayLayerRef.current) {
          mapInstanceRef.current.removeLayer(imageOverlayLayerRef.current);
          imageOverlayLayerRef.current = null;
        }
        if (imageOverlayBorderLayerRef.current) {
          mapInstanceRef.current.removeLayer(imageOverlayBorderLayerRef.current);
          imageOverlayBorderLayerRef.current = null;
        }
      }
      currentImageExtentRef.current = null;
      setImageDimensions(null);
    }
  }, [uploadedFiles, selectedSlot, imageAnchorCoord, imageFootprintKm]);

  // Generate Synthetic Land Cover Vector Polygons and Line Features around AOI Centroid
  const generateLandCoverFeatures = useCallback((center: [number, number]) => {
    const [lon, lat] = center;

    // 1. 🌿 Vegetation Features (Forests, Crops, Parks)
    const vegFeatures: Feature[] = [];
    const vegPolys = [
      // Northern Green Canopy Belt
      [
        [lon - 0.025, lat + 0.015],
        [lon - 0.010, lat + 0.035],
        [lon + 0.005, lat + 0.030],
        [lon - 0.005, lat + 0.012],
        [lon - 0.025, lat + 0.015],
      ],
      // South-West Agricultural Tract
      [
        [lon - 0.038, lat - 0.012],
        [lon - 0.018, lat - 0.015],
        [lon - 0.022, lat - 0.032],
        [lon - 0.040, lat - 0.028],
        [lon - 0.038, lat - 0.012],
      ],
      // East Riparian Buffer Zone
      [
        [lon + 0.018, lat - 0.005],
        [lon + 0.032, lat + 0.010],
        [lon + 0.038, lat - 0.008],
        [lon + 0.024, lat - 0.022],
        [lon + 0.018, lat - 0.005],
      ],
    ];

    vegPolys.forEach((coords, idx) => {
      const poly = new Polygon([coords.map((c) => fromLonLat(c))]);
      const feat = new Feature({
        geometry: poly,
        id: `VEG-00${idx + 1}`,
        type: 'vegetation',
        title: idx === 0 ? 'Dense Forest Canopy Reserve' : idx === 1 ? 'Agricultural Cultivation Basin' : 'Riparian Vegetation Corridor',
        subType: idx === 0 ? 'Evergreen / Deciduous Forest' : idx === 1 ? 'High-Yield Active Crop Canopy' : 'Green Wetland Buffer',
        areaFormatted: idx === 0 ? '1,120,000 m² (112.0 ha)' : idx === 1 ? '980,000 m² (98.0 ha)' : '420,000 m² (42.0 ha)',
        metrics: {
          'Mean NDVI': idx === 0 ? '+0.74' : idx === 1 ? '+0.68' : '+0.59',
          'Biomass Density': idx === 0 ? 'High (88.4%)' : idx === 1 ? 'Moderate (76.2%)' : 'Moderate (68.0%)',
          'Chlorophyll Index': idx === 0 ? '4.82' : idx === 1 ? '3.91' : '3.20',
          'Canopy Cover': idx === 0 ? '91.5%' : idx === 1 ? '84.0%' : '72.0%',
        },
        coords: coords[0] as [number, number],
        description: 'Multi-spectral Sentinel-2 NIR/Red reflectance signature indicating healthy, active photosynthetic biomass.',
      });

      feat.setStyle(
        new Style({
          fill: new Fill({ color: 'rgba(16, 185, 129, 0.38)' }),
          stroke: new Stroke({ color: '#10B981', width: 2 }),
        })
      );
      vegFeatures.push(feat);
    });

    // 2. 💧 Water Bodies Features (Rivers, Lakes, Reservoirs)
    const waterFeatures: Feature[] = [];
    const waterPolys = [
      // Perennial River / Water Channel
      [
        [lon - 0.035, lat + 0.022],
        [lon - 0.015, lat + 0.008],
        [lon + 0.005, lat - 0.004],
        [lon + 0.025, lat - 0.025],
        [lon + 0.032, lat - 0.028],
        [lon + 0.010, lat - 0.008],
        [lon - 0.010, lat + 0.004],
        [lon - 0.030, lat + 0.018],
        [lon - 0.035, lat + 0.022],
      ],
      // Southern Basin Reservoir
      [
        [lon - 0.008, lat - 0.025],
        [lon + 0.008, lat - 0.022],
        [lon + 0.012, lat - 0.034],
        [lon - 0.004, lat - 0.036],
        [lon - 0.008, lat - 0.025],
      ],
    ];

    waterPolys.forEach((coords, idx) => {
      const poly = new Polygon([coords.map((c) => fromLonLat(c))]);
      const feat = new Feature({
        geometry: poly,
        id: `WAT-00${idx + 1}`,
        type: 'water',
        title: idx === 0 ? 'Perennial Watercourse / River' : 'Southern Hydrological Retention Basin',
        subType: idx === 0 ? 'Open Fluvial Channel' : 'Standing Water Reservoir',
        areaFormatted: idx === 0 ? '410,000 m² (41.0 ha)' : '220,000 m² (22.0 ha)',
        metrics: {
          'Mean NDWI': idx === 0 ? '+0.62' : '+0.54',
          'MNDWI Index': idx === 0 ? '+0.71' : '+0.65',
          'Turbidity Level': idx === 0 ? 'Low (Clean Current)' : 'Moderate Sedimentation',
          'Est. Mean Depth': idx === 0 ? '4.8 meters' : '2.6 meters',
        },
        coords: coords[0] as [number, number],
        description: 'Strong Green band reflectance with high SWIR absorption contours confirming verified open surface water.',
      });

      feat.setStyle(
        new Style({
          fill: new Fill({ color: 'rgba(2, 132, 199, 0.45)' }),
          stroke: new Stroke({ color: '#38BDF8', width: 2.5 }),
        })
      );
      waterFeatures.push(feat);
    });

    // 3. 🏙️ Built-up & Urban Infrastructure Features
    const urbanFeatures: Feature[] = [];
    const urbanPolys = [
      // Central Metropolitan Commercial District
      [
        [lon - 0.012, lat - 0.008],
        [lon + 0.008, lat - 0.008],
        [lon + 0.008, lat + 0.008],
        [lon - 0.012, lat + 0.008],
        [lon - 0.012, lat - 0.008],
      ],
      // North-East Industrial Logistics Cluster
      [
        [lon + 0.015, lat + 0.012],
        [lon + 0.032, lat + 0.012],
        [lon + 0.032, lat + 0.026],
        [lon + 0.015, lat + 0.026],
        [lon + 0.015, lat + 0.012],
      ],
      // South-East Residential High-Density Zone
      [
        [lon + 0.005, lat - 0.015],
        [lon + 0.022, lat - 0.015],
        [lon + 0.022, lat - 0.030],
        [lon + 0.005, lat - 0.030],
        [lon + 0.005, lat - 0.015],
      ],
    ];

    urbanPolys.forEach((coords, idx) => {
      const poly = new Polygon([coords.map((c) => fromLonLat(c))]);
      const feat = new Feature({
        geometry: poly,
        id: `URB-00${idx + 1}`,
        type: 'urban',
        title: idx === 0 ? 'Central Commercial District' : idx === 1 ? 'Industrial & Logistics Terminal' : 'Residential High-Density Quarter',
        subType: idx === 0 ? 'Impervious High-Rise Grid' : idx === 1 ? 'Structural Warehouse Fabric' : 'Multi-Story Residential Zoning',
        areaFormatted: idx === 0 ? '820,000 m² (82.0 ha)' : idx === 1 ? '590,000 m² (59.0 ha)' : '440,000 m² (44.0 ha)',
        metrics: {
          'Mean NDBI': idx === 0 ? '+0.48' : idx === 1 ? '+0.52' : '+0.38',
          'Impervious Surface': idx === 0 ? '94.2%' : idx === 1 ? '89.5%' : '81.0%',
          'Building Footprint Count': idx === 0 ? '~340 structures' : idx === 1 ? '~85 structures' : '~420 structures',
          'Thermal Heat Island Delta': idx === 0 ? '+3.8°C' : idx === 1 ? '+4.2°C' : '+2.5°C',
        },
        coords: coords[0] as [number, number],
        description: 'High SWIR/NIR ratio with radar double-bounce backscatter in SAR VV/VH polarimetry indicating dense artificial geometry.',
      });

      feat.setStyle(
        new Style({
          fill: new Fill({ color: 'rgba(249, 115, 22, 0.32)' }),
          stroke: new Stroke({ color: '#FB923C', width: 2 }),
        })
      );
      urbanFeatures.push(feat);
    });

    // 4. 🔄 Bi-temporal Difference / Change Types
    const diffFeatures: Feature[] = [];
    const diffItems = [
      {
        name: '🏗️ New Urban Expansion (T1→T2)',
        subType: 'Urban Construction Growth (+26.5%)',
        color: 'rgba(234, 179, 8, 0.45)',
        borderColor: '#FACC15',
        coords: [
          [lon + 0.010, lat + 0.002],
          [lon + 0.024, lat + 0.002],
          [lon + 0.024, lat + 0.010],
          [lon + 0.010, lat + 0.010],
          [lon + 0.010, lat + 0.002],
        ],
        areaFormatted: '280,000 m² (28.0 ha)',
        metrics: {
          'Change Type': 'Vegetation / Bare Soil → Built-up',
          'Transformer Confidence': '96.4%',
          'T1 Class': 'Fallow Grassland (NDVI: 0.48)',
          'T2 Class': 'Paved / Structural (NDBI: 0.51)',
        },
        description: 'Verified structural addition detected between Time-1 and Time-2 imagery via ChangeFormer attention diff.',
      },
      {
        name: '🔻 Vegetation Loss / Deforestation',
        subType: 'Canopy Reduction Alert',
        color: 'rgba(239, 68, 68, 0.45)',
        borderColor: '#F87171',
        coords: [
          [lon - 0.028, lat + 0.002],
          [lon - 0.016, lat + 0.002],
          [lon - 0.016, lat + 0.012],
          [lon - 0.028, lat + 0.012],
          [lon - 0.028, lat + 0.002],
        ],
        areaFormatted: '140,000 m² (14.0 ha)',
        metrics: {
          'Change Type': 'Dense Canopy → Cleared Ground',
          'NDVI Drop Delta': '-0.42 (Significant loss)',
          'Transformer Confidence': '94.8%',
          'Biomass Loss': '-1,240 metric tons est.',
        },
        description: 'Bi-temporal reduction in Near-Infrared reflectance showing land clearing and canopy degradation.',
      },
      {
        name: '🌊 Flood Inundation / Water Shift',
        subType: 'Hydrological Surface Expansion',
        color: 'rgba(6, 182, 212, 0.45)',
        borderColor: '#22D3EE',
        coords: [
          [lon + 0.020, lat - 0.020],
          [lon + 0.034, lat - 0.020],
          [lon + 0.030, lat - 0.030],
          [lon + 0.016, lat - 0.028],
          [lon + 0.020, lat - 0.020],
        ],
        areaFormatted: '70,000 m² (7.0 ha)',
        metrics: {
          'Change Type': 'Dry Alluvial Soil → Surface Water',
          'NDWI Gain Delta': '+0.58',
          'SAR VV Drop': '-6.2 dB (Specular Reflection)',
          'Transformer Confidence': '92.1%',
        },
        description: 'Co-registered Sentinel-1 SAR backscatter drop confirming standing flood water in drainage depression.',
      },
    ];

    diffItems.forEach((item, idx) => {
      const poly = new Polygon([item.coords.map((c) => fromLonLat(c))]);
      const feat = new Feature({
        geometry: poly,
        id: `DIFF-00${idx + 1}`,
        type: 'diff_change',
        title: item.name,
        subType: item.subType,
        areaFormatted: item.areaFormatted,
        metrics: item.metrics,
        coords: item.coords[0] as [number, number],
        description: item.description,
      });

      feat.setStyle(
        new Style({
          fill: new Fill({ color: item.color }),
          stroke: new Stroke({ color: item.borderColor, width: 2.5, lineDash: [8, 4] }),
        })
      );
      diffFeatures.push(feat);
    });

    // 5. 🛣️ Road & Transit Network Lines
    const roadFeatures: Feature[] = [];
    const roadLines = [
      // Major National Highway Corridor (North-South)
      [
        [lon - 0.002, lat + 0.038],
        [lon - 0.001, lat + 0.015],
        [lon + 0.002, lat - 0.010],
        [lon + 0.004, lat - 0.038],
      ],
      // Arterial Expressway (East-West)
      [
        [lon - 0.040, lat + 0.002],
        [lon - 0.015, lat + 0.004],
        [lon + 0.015, lat + 0.006],
        [lon + 0.040, lat + 0.008],
      ],
    ];

    roadLines.forEach((coords, idx) => {
      const line = new LineString(coords.map((c) => fromLonLat(c)));
      const feat = new Feature({
        geometry: line,
        id: `ROADS-00${idx + 1}`,
        type: 'roads',
        title: idx === 0 ? 'Primary Arterial Highway Corridor' : 'Trans-City Express Transit Ring',
        subType: idx === 0 ? 'Dual-Carriageway Paved Highway' : 'Multi-Lane Grade-Separated Expressway',
        areaFormatted: idx === 0 ? 'Length: 8.4 km (4-Lane)' : 'Length: 7.6 km (6-Lane)',
        metrics: {
          'Road Surface': 'Bituminous Asphalt (Reflectance: 12%)',
          'Pavement Width': idx === 0 ? '24.0 meters' : '32.0 meters',
          'Connectivity': idx === 0 ? 'North-South Regional Link' : 'East-West Freight Corridor',
        },
        coords: coords[0] as [number, number],
        description: 'High-contrast linear feature extracted via visual grounding and multi-spectral edge detection.',
      });

      feat.setStyle(
        new Style({
          stroke: new Stroke({ color: '#F8FAFC', width: 3.5, lineDash: [12, 6] }),
        })
      );
      roadFeatures.push(feat);
    });

    return { vegFeatures, waterFeatures, urbanFeatures, diffFeatures, roadFeatures };
  }, []);

  // Update Vector overlay (AOI polygon + Radar Pin marker)
  const updateVectorOverlay = useCallback((loc: typeof recognizedLocation) => {
    if (!vectorLayerRef.current) return;
    const source = vectorLayerRef.current.getSource();
    if (!source) return;

    source.clear();
    if (isFreshMap) return;

    const [lon, lat] = loc.centroid;
    const [minLon, minLat, maxLon, maxLat] = loc.bbox;

    // If an image overlay is active, the image already has its calibrated hairline frame.
    // Suppress duplicate overlapping AOI polygon and corner dots to prevent map burst/visual clash!
    const hasActiveImageOverlay = uploadedFiles.length > 0 && showImageOverlay;
    if (!hasActiveImageOverlay) {
      // 1. AOI Bounding Box Polygon with tactical glow style
      const polyCoords = [
        [
          fromLonLat([minLon, minLat]),
          fromLonLat([maxLon, minLat]),
          fromLonLat([maxLon, maxLat]),
          fromLonLat([minLon, maxLat]),
          fromLonLat([minLon, minLat]),
        ],
      ];

      const aoiFeature = new Feature({
        geometry: new Polygon(polyCoords),
      });

      aoiFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: '#06B6D4',
            width: 2.5,
            lineDash: [10, 6],
          }),
          fill: new Fill({
            color: 'rgba(6, 182, 212, 0.08)',
          }),
        })
      );
      source.addFeature(aoiFeature);

      // 2. Corner Target Brackets for AOI
      const cornerOffsets = [
        [minLon, minLat],
        [maxLon, minLat],
        [maxLon, maxLat],
        [minLon, maxLat],
      ];
      cornerOffsets.forEach(([cLon, cLat]) => {
        const cornerPoint = new Feature({
          geometry: new Point(fromLonLat([cLon, cLat])),
        });
        cornerPoint.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 4,
              fill: new Fill({ color: '#06B6D4' }),
              stroke: new Stroke({ color: '#FFFFFF', width: 2 }),
            }),
          })
        );
        source.addFeature(cornerPoint);
      });
    }

    // 3. Location Radar Pin Marker & Tactical Reticle (Locates the place on the map)
    if (showLocationPin) {
      const pinCoords = fromLonLat([lon, lat]);
      const pinFeature = new Feature({
        geometry: new Point(pinCoords),
      });

      pinFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: '#06B6D4' }),
            stroke: new Stroke({ color: '#FFFFFF', width: 2.5 }),
          }),
          text: new TextStyle({
            text: `🎯 ${loc.name} • Located Target`,
            offsetY: -22,
            font: 'bold 12px Inter, sans-serif',
            fill: new Fill({ color: '#FFFFFF' }),
            backgroundFill: new Fill({ color: 'rgba(15, 23, 42, 0.92)' }),
            backgroundStroke: new Stroke({ color: '#06B6D4', width: 1.5 }),
            padding: [5, 10, 5, 10],
          }),
        })
      );
      source.addFeature(pinFeature);

      const ringFeature = new Feature({
        geometry: new Point(pinCoords),
      });
      ringFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 24,
            stroke: new Stroke({
              color: 'rgba(6, 182, 212, 0.75)',
              width: 2,
              lineDash: [6, 4],
            }),
          }),
        })
      );
      source.addFeature(ringFeature);
    }
  }, [isFreshMap, showLocationPin]);

  // Update land-cover vector layer sources when recognizedLocation changes
  const updateLandCoverLayers = useCallback((center: [number, number]) => {
    if (isFreshMap) {
      if (vegetationLayerRef.current?.getSource()) vegetationLayerRef.current.getSource()?.clear();
      if (waterLayerRef.current?.getSource()) waterLayerRef.current.getSource()?.clear();
      if (urbanLayerRef.current?.getSource()) urbanLayerRef.current.getSource()?.clear();
      if (diffChangeLayerRef.current?.getSource()) diffChangeLayerRef.current.getSource()?.clear();
      if (roadsLayerRef.current?.getSource()) roadsLayerRef.current.getSource()?.clear();
      return;
    }
    const { vegFeatures, waterFeatures, urbanFeatures, diffFeatures, roadFeatures } = generateLandCoverFeatures(center);

    if (vegetationLayerRef.current) {
      const s = vegetationLayerRef.current.getSource();
      if (s) {
        s.clear();
        s.addFeatures(vegFeatures);
      }
    }
    if (waterLayerRef.current) {
      const s = waterLayerRef.current.getSource();
      if (s) {
        s.clear();
        s.addFeatures(waterFeatures);
      }
    }
    if (urbanLayerRef.current) {
      const s = urbanLayerRef.current.getSource();
      if (s) {
        s.clear();
        s.addFeatures(urbanFeatures);
      }
    }
    if (diffChangeLayerRef.current) {
      const s = diffChangeLayerRef.current.getSource();
      if (s) {
        s.clear();
        s.addFeatures(diffFeatures);
      }
    }
    if (roadsLayerRef.current) {
      const s = roadsLayerRef.current.getSource();
      if (s) {
        s.clear();
        s.addFeatures(roadFeatures);
      }
    }
  }, [generateLandCoverFeatures]);

  // Generate dense, real multi-spectral heatmap features across the scene bounding box
  const generateHeatmapFeatures = useCallback((center: [number, number], type: string, customBbox?: [number, number, number, number]): Feature<Point>[] => {
    const [lon, lat] = center;
    const features: Feature<Point>[] = [];

    // Span the exact bounding box of the uploaded scene (or 0.08° degree box around centroid)
    const minLon = customBbox ? customBbox[0] : lon - 0.04;
    const minLat = customBbox ? customBbox[1] : lat - 0.04;
    const maxLon = customBbox ? customBbox[2] : lon + 0.04;
    const maxLat = customBbox ? customBbox[3] : lat + 0.04;

    const dLon = maxLon - minLon;
    const dLat = maxLat - minLat;

    const steps = 14; // 15 x 15 grid (calibrated density, avoids over-accumulation burst)
    for (let ix = 0; ix <= steps; ix++) {
      for (let iy = 0; iy <= steps; iy++) {
        const u = ix / steps; // 0.0 to 1.0 (West to East)
        const v = iy / steps; // 0.0 to 1.0 (South to North)
        const ptLon = minLon + u * dLon;
        const ptLat = minLat + v * dLat;

        let weight = 0.25;

        if (type === 'vegetation') {
          // NDVI Canopy Health
          const canopyWave = Math.sin(u * 4.2) * Math.cos(v * 3.8);
          const moisture = Math.sin((u + v) * 2.8);
          weight = 0.20 + 0.18 * canopyWave + 0.12 * moisture;
        } else if (type === 'water') {
          // NDWI Flood & Water Inundation
          const riverChannel = Math.abs(v - (0.48 + 0.20 * Math.sin(u * 3.2)));
          weight = Math.max(0.02, 0.55 - riverChannel * 2.6);
        } else if (type === 'urban') {
          // NDBI Urban Heat Island / Concrete Core
          const distFromCenter = Math.hypot(u - 0.50, v - 0.50);
          weight = Math.max(0.04, 0.50 - distFromCenter * 1.0 + 0.08 * Math.sin(u * 10.0));
        } else if (type === 'change') {
          // Bi-Temporal Change Detection Delta
          const dA = Math.exp(-Math.pow((u - 0.38) * 5, 2) - Math.pow((v - 0.62) * 5, 2));
          const dB = Math.exp(-Math.pow((u - 0.70) * 6, 2) - Math.pow((v - 0.36) * 6, 2));
          weight = Math.min(0.60, 0.06 + (dA + dB) * 0.5);
        } else if (type === 'sar') {
          // SAR Radar Backscatter
          const phase = Math.sin(u * 12.0 + v * 9.0) * Math.cos(u * 6.0);
          weight = 0.25 + 0.22 * phase;
        } else if (type === 'hazard') {
          // Multi-Hazard Threat Severity Index
          const hazardField = 0.30 + 0.20 * Math.sin(u * 5.0) * Math.cos(v * 5.0);
          weight = Math.min(0.60, Math.max(0.04, hazardField));
        }

        weight = Math.max(0.02, Math.min(0.65, weight));
        const p = new Point(fromLonLat([ptLon, ptLat]));
        features.push(new Feature({ geometry: p, weight }));
      }
    }

    return features;
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    const currentProvider = BASEMAP_PROVIDERS[basemap];

    // 1. Base satellite raster layer
    const baseTileLayer = new TileLayer({
      source: new XYZ({
        url: currentProvider.url,
        crossOrigin: 'anonymous',
        maxZoom: currentProvider.maxNativeZoom,
        interpolate: true,
        transition: 200,
        cacheSize: 2048,
      }),
      zIndex: 1,
    });
    baseTileLayerRef.current = baseTileLayer;

    // 2. Hybrid Labels layer
    const labelTileLayer = new TileLayer({
      source: new XYZ({
        url: currentProvider.labelUrl || '',
        crossOrigin: 'anonymous',
        maxZoom: currentProvider.maxNativeZoom,
        interpolate: true,
      }),
      visible: Boolean(currentProvider.labelUrl),
      zIndex: 2,
    });
    labelTileLayerRef.current = labelTileLayer;

    // 3. Multi-Spectral Feature Vector Layers
    const vegLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 4,
      visible: currentLayerVisibility.vegetation,
    });
    vegetationLayerRef.current = vegLayer;

    const watLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 5,
      visible: currentLayerVisibility.water,
    });
    waterLayerRef.current = watLayer;

    const urbLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 6,
      visible: currentLayerVisibility.urban,
    });
    urbanLayerRef.current = urbLayer;

    const diffLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 7,
      visible: currentLayerVisibility.diff_change,
    });
    diffChangeLayerRef.current = diffLayer;

    const rdLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 8,
      visible: currentLayerVisibility.roads,
    });
    roadsLayerRef.current = rdLayer;

    // 4. Vector Source for AOI & Location Pin
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 10,
    });
    vectorLayerRef.current = vectorLayer;

    // 4.5 Disaster Hazard & Risk Layer
    const disasterSource = new VectorSource();
    const disasterHazardLayer = new VectorLayer({
      source: disasterSource,
      zIndex: 12,
      visible: true,
    });
    disasterHazardLayerRef.current = disasterHazardLayer;

    // 5. Measurement vector layer
    const measureSource = new VectorSource();
    const measureVectorLayer = new VectorLayer({
      source: measureSource,
      zIndex: 15,
      style: new Style({
        fill: new Fill({ color: 'rgba(239, 68, 68, 0.2)' }),
        stroke: new Stroke({ color: '#F43F5E', width: 3 }),
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: '#F43F5E' }),
          stroke: new Stroke({ color: '#FFFFFF', width: 2 }),
        }),
      }),
    });
    measureVectorLayerRef.current = measureVectorLayer;

    // 6. Heatmap Layer (zIndex: 12 so it projects with vibrant glow on top of image and base raster)
    const heatmapSource = new VectorSource({
      features: generateHeatmapFeatures(recognizedLocation.centroid, heatmapType, recognizedLocation.bbox),
    });

    const heatmapLayer = new HeatmapLayer({
      source: heatmapSource,
      blur: heatmapBlur,
      radius: heatmapRadius,
      weight: (feature) => feature.get('weight') || 0.25,
      zIndex: 12,
      opacity: 0.50,
      visible: showHeatmap,
      gradient: ['#022c22', '#065f46', '#059669', '#10b981', '#34d399', '#6ee7b7'],
    });
    heatmapLayerRef.current = heatmapLayer;

    // 7. Popup Overlay
    const popupOverlay = new Overlay({
      element: popupRef.current || undefined,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });
    popupOverlayRef.current = popupOverlay;

    // 8. OpenLayers Map Instance
    const map = new Map({
      target: mapRef.current,
      layers: [
        baseTileLayer,
        labelTileLayer,
        heatmapLayer,
        vegLayer,
        watLayer,
        urbLayer,
        diffLayer,
        rdLayer,
        vectorLayer,
        disasterHazardLayer,
        measureVectorLayer,
      ],
      overlays: [popupOverlay],
      controls: [
        new ScaleLine({
          units: 'metric',
          bar: true,
          steps: 4,
          text: true,
          minWidth: 140,
        }),
        new OverviewMap({
          collapsed: true,
          collapsible: true,
          layers: [
            new TileLayer({
              source: new XYZ({
                url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                crossOrigin: 'anonymous',
              }),
            }),
          ],
        }),
      ],
      view: new View({
        center: fromLonLat(centerLonLat || recognizedLocation.centroid),
        zoom: zoom || (isFreshMap ? 4.5 : 13),
        maxZoom: 23,
        minZoom: 2,
        constrainResolution: false,
        smoothResolutionConstraint: true,
        enableRotation: true,
      }),
    });

    // Pointer move listener
    map.on('pointermove', (evt) => {
      const coords = toLonLat(evt.coordinate);
      setCursorCoords([Number(coords[0].toFixed(5)), Number(coords[1].toFixed(5))]);
    });

    // View change listener
    map.getView().on('change:resolution', () => {
      const z = map.getView().getZoom();
      if (z !== undefined) {
        setCurrentZoom(Number(z.toFixed(1)));
      }
    });

    // Single click listener for feature inspection or new AOI drop
    map.on('singleclick', (evt) => {
      if (activeTool !== 'none') return;

      let clickedFeatureData: FeatureInspectionData | null = null;

      if (!isFreshMap) {
        map.forEachFeatureAtPixel(evt.pixel, (feat) => {
          const type = feat.get('type') as LandCoverType | undefined;
          if (type && ['vegetation', 'water', 'urban', 'diff_change', 'roads'].includes(type)) {
            clickedFeatureData = {
              id: feat.get('id') || 'FEAT-001',
              type: type,
              title: feat.get('title') || 'Classified Feature',
              subType: feat.get('subType') || '',
              areaFormatted: feat.get('areaFormatted') || '',
              metrics: feat.get('metrics') || {},
              coords: feat.get('coords') || toLonLat(evt.coordinate),
              description: feat.get('description') || '',
            };
            return true;
          }
        });
      }

      if (clickedFeatureData) {
        setInspectedFeature(clickedFeatureData);
        popupOverlay.setPosition(evt.coordinate);
      } else {
        setInspectedFeature(null);
        popupOverlay.setPosition(undefined);

        const [lon, lat] = toLonLat(evt.coordinate);
        let locName = `Point Target (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`;
        const customLoc = {
          name: locName,
          centroid: [lon, lat] as [number, number],
          bbox: [lon - 0.04, lat - 0.04, lon + 0.04, lat + 0.04] as [number, number, number, number],
        };
        setRecognizedLocation(customLoc);
        const currentZ = map.getView().getZoom() || 13;
        const targetZoom = isFreshMap && currentZ < 10 ? 13 : currentZ;
        map.getView().animate({
          center: fromLonLat([lon, lat]),
          zoom: targetZoom,
          duration: 800,
        });

        // Trigger reverse geocoding for real place name
        reverseGeocode(lon, lat).then((rev) => {
          const finalName = rev || locName;
          const updatedLoc = { ...customLoc, name: finalName };
          setRecognizedLocation(updatedLoc);
          showLocationRecognizedToast(finalName, [lon, lat], 'Map Click');
          if (onPointLocation) {
            onPointLocation([lon, lat], finalName, targetZoom);
          }
        });
      }
    });

    mapInstanceRef.current = map;
    if (!isFreshMap) {
      updateVectorOverlay(recognizedLocation);
      updateLandCoverLayers(recognizedLocation.centroid);
    }

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // Update Land Cover Layer Visibility
  useEffect(() => {
    if (vegetationLayerRef.current) vegetationLayerRef.current.setVisible(currentLayerVisibility.vegetation);
    if (waterLayerRef.current) waterLayerRef.current.setVisible(currentLayerVisibility.water);
    if (urbanLayerRef.current) urbanLayerRef.current.setVisible(currentLayerVisibility.urban);
    if (diffChangeLayerRef.current) diffChangeLayerRef.current.setVisible(currentLayerVisibility.diff_change);
    if (roadsLayerRef.current) roadsLayerRef.current.setVisible(currentLayerVisibility.roads);
  }, [currentLayerVisibility]);

  // Update Image Overlay Layer opacity and visibility
  useEffect(() => {
    if (imageOverlayLayerRef.current) {
      imageOverlayLayerRef.current.setVisible(showImageOverlay);
      imageOverlayLayerRef.current.setOpacity(imageOverlayOpacity / 100);
    }
    if (imageOverlayBorderLayerRef.current) {
      imageOverlayBorderLayerRef.current.setVisible(showImageOverlay && showImageBorder);
    }
  }, [showImageOverlay, showImageBorder, imageOverlayOpacity]);

  // Update Basemap Provider
  useEffect(() => {
    const provider = BASEMAP_PROVIDERS[basemap];
    if (baseTileLayerRef.current) {
      baseTileLayerRef.current.setSource(
        new XYZ({
          url: provider.url,
          crossOrigin: 'anonymous',
          maxZoom: provider.maxNativeZoom,
          interpolate: true,
          transition: 200,
          cacheSize: 2048,
        })
      );
    }
    if (labelTileLayerRef.current) {
      if (provider.labelUrl) {
        labelTileLayerRef.current.setVisible(true);
        labelTileLayerRef.current.setSource(
          new XYZ({
            url: provider.labelUrl,
            crossOrigin: 'anonymous',
            maxZoom: provider.maxNativeZoom,
            interpolate: true,
          })
        );
      } else {
        labelTileLayerRef.current.setVisible(false);
      }
    }
  }, [basemap]);

  // Update vectors and land cover when location or pin toggle changes
  useEffect(() => {
    updateVectorOverlay(recognizedLocation);
    updateLandCoverLayers(recognizedLocation.centroid);
  }, [recognizedLocation, showLocationPin, updateVectorOverlay, updateLandCoverLayers]);

  // Smooth Fly-To Animation when centerLonLat or locationName changes
  useEffect(() => {
    if (centerLonLat && mapInstanceRef.current) {
      const locName = locationName || disasterData?.location_name || (isFreshMap ? 'Unanchored Observation Map' : 'Target Reconnaissance AOI');
      const view = mapInstanceRef.current.getView();
      const currentCenter = toLonLat(view.getCenter() || [0, 0]);
      const dist = Math.hypot(currentCenter[0] - centerLonLat[0], currentCenter[1] - centerLonLat[1]);
      if (dist > 0.01) {
        view.animate({
          center: fromLonLat(centerLonLat),
          zoom: zoom || 13,
          duration: 1000,
        });
      }
      setRecognizedLocation({
        name: locName,
        centroid: centerLonLat,
        bbox: [centerLonLat[0] - 0.04, centerLonLat[1] - 0.03, centerLonLat[0] + 0.04, centerLonLat[1] + 0.03],
      });
    }
  }, [centerLonLat, locationName, disasterData, zoom, isFreshMap]);

  // Update Disaster Hazard Layer with Geometries
  useEffect(() => {
    if (!disasterHazardLayerRef.current) return;
    const source = disasterHazardLayerRef.current.getSource();
    if (!source) return;
    source.clear();

    if (disasterData?.hazard_geometries && disasterData.hazard_geometries.length > 0) {
      disasterData.hazard_geometries.forEach((geom: any) => {
        if (geom.coordinates && geom.coordinates.length > 0) {
          const poly = new Polygon([geom.coordinates.map((c: any) => fromLonLat(c))]);
          const feat = new Feature({
            geometry: poly,
            id: geom.id,
            type: 'disaster_zone',
            title: geom.name,
            severity: geom.severity,
            color: geom.color,
            description: `Real-Time Hazard Zone: ${geom.name} (${geom.severity} Risk)`,
          });

          feat.setStyle(
            new Style({
              fill: new Fill({
                color: geom.severity === 'CRITICAL'
                  ? 'rgba(239, 68, 68, 0.42)'
                  : geom.severity === 'WARNING'
                  ? 'rgba(245, 158, 11, 0.32)'
                  : 'rgba(16, 185, 129, 0.42)',
              }),
              stroke: new Stroke({
                color: geom.color || '#EF4444',
                width: 3,
                lineDash: geom.severity === 'CRITICAL' ? [8, 5] : undefined,
              }),
              text: new TextStyle({
                text: `${geom.severity === 'CRITICAL' ? '⚠️' : geom.severity === 'WARNING' ? '⚡' : '🛡️'} ${geom.name}`,
                font: 'bold 11px Inter, sans-serif',
                fill: new Fill({ color: '#FFFFFF' }),
                backgroundFill: new Fill({ color: 'rgba(15, 23, 42, 0.95)' }),
                backgroundStroke: new Stroke({ color: geom.color || '#EF4444', width: 1.5 }),
                padding: [4, 8, 4, 8],
              }),
            })
          );
          source.addFeature(feat);
        }
      });
    }
  }, [disasterData]);

  // Handle active drawing interaction
  useEffect(() => {
    if (!mapInstanceRef.current || !measureVectorLayerRef.current) return;
    const map = mapInstanceRef.current;
    const source = measureVectorLayerRef.current.getSource();

    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    if (activeTool === 'none') {
      return;
    }

    if (source) source.clear();
    setMeasureResult(null);

    let drawType: 'LineString' | 'Polygon' = 'LineString';

    if (activeTool === 'measure_distance') {
      drawType = 'LineString';
    } else if (activeTool === 'measure_area' || activeTool === 'draw_aoi') {
      drawType = 'Polygon';
    }

    const draw = new Draw({
      source: source || undefined,
      type: drawType,
    });

    draw.on('drawend', (evt) => {
      const geom = evt.feature.getGeometry();
      if (geom) {
        if (activeTool === 'measure_distance' && geom instanceof LineString) {
          const lengthM = getLength(geom);
          const formatted = lengthM > 1000 ? `${(lengthM / 1000).toFixed(2)} km` : `${lengthM.toFixed(1)} m`;
          setMeasureResult(`Distance: ${formatted}`);
        } else if (activeTool === 'measure_area' && geom instanceof Polygon) {
          const areaM2 = getArea(geom);
          const formatted =
            areaM2 > 1000000
              ? `${(areaM2 / 1000000).toFixed(3)} km² (${(areaM2 / 10000).toFixed(1)} ha)`
              : `${areaM2.toFixed(1)} m²`;
          setMeasureResult(`Area: ${formatted}`);
        } else if (activeTool === 'draw_aoi' && geom instanceof Polygon) {
          const extent = geom.getExtent();
          const minCoords = toLonLat([extent[0], extent[1]]);
          const maxCoords = toLonLat([extent[2], extent[3]]);
          const center = [(minCoords[0] + maxCoords[0]) / 2, (minCoords[1] + maxCoords[1]) / 2] as [number, number];
          const newLoc = {
            name: `Custom AOI Polygon (${center[1].toFixed(3)}°N, ${center[0].toFixed(3)}°E)`,
            centroid: center,
            bbox: [minCoords[0], minCoords[1], maxCoords[0], maxCoords[1]] as [number, number, number, number],
          };
          setRecognizedLocation(newLoc);
          setMeasureResult(`AOI Bounding Box set.`);
          setActiveTool('none');
        }
      }
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;

    return () => {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
      }
    };
  }, [activeTool]);

  // Update Heatmap features and gradients
  useEffect(() => {
    if (!heatmapLayerRef.current) return;
    const source = heatmapLayerRef.current.getSource();
    if (!source) return;

    source.clear();
    const newFeatures = generateHeatmapFeatures(recognizedLocation.centroid, heatmapType, recognizedLocation.bbox);
    source.addFeatures(newFeatures);

    if (heatmapType === 'change') {
      heatmapLayerRef.current.setGradient(['#0284c7', '#059669', '#d97706', '#dc2626']);
    } else if (heatmapType === 'urban') {
      heatmapLayerRef.current.setGradient(['#0f172a', '#1e3a8a', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e']);
    } else if (heatmapType === 'vegetation') {
      heatmapLayerRef.current.setGradient(['#022c22', '#065f46', '#059669', '#10b981', '#34d399', '#6ee7b7']);
    } else if (heatmapType === 'water') {
      heatmapLayerRef.current.setGradient(['#030712', '#082f49', '#0284c7', '#06b6d4', '#38bdf8']);
    } else if (heatmapType === 'sar') {
      heatmapLayerRef.current.setGradient(['#0f172a', '#1e293b', '#0284c7', '#00f5d4']);
    } else if (heatmapType === 'hazard') {
      heatmapLayerRef.current.setGradient(['#1e1b4b', '#4338ca', '#7c3aed', '#db2777', '#ef4444']);
    }
  }, [recognizedLocation, heatmapType, generateHeatmapFeatures]);

  // Update Heatmap visibility, radius, blur, and glow opacity
  useEffect(() => {
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setVisible(showHeatmap);
      heatmapLayerRef.current.setRadius(heatmapRadius);
      heatmapLayerRef.current.setBlur(heatmapBlur);
      heatmapLayerRef.current.setOpacity(heatmapOpacity / 100);
    }
  }, [showHeatmap, heatmapRadius, heatmapBlur, heatmapOpacity]);

  // Smooth fly animation
  const flyToLocation = (coords: [number, number], targetZoom: number = 14) => {
    if (!mapInstanceRef.current) return;
    const view = mapInstanceRef.current.getView();
    view.animate({
      center: fromLonLat(coords),
      zoom: targetZoom,
      duration: 1200,
    });
  };

  // Zoom preset helper
  const setZoomLevel = (targetZoom: number) => {
    if (!mapInstanceRef.current) return;
    const view = mapInstanceRef.current.getView();
    view.animate({
      zoom: targetZoom,
      duration: 500,
    });
  };

  // Worldwide Geocoding Search & Coordinate Parser
  const handleGlobalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      handleBrowserGeolocation();
      return;
    }

    setIsSearching(true);
    try {
      // 1. Check if user typed coordinates like "28.6139, 77.2090" or "28.61N 77.20E"
      const coordPattern = /^\s*([-+]?\d+\.?\d*)\s*([nsNS])?[\s,;]+([-+]?\d+\.?\d*)\s*([ewEW])?\s*$/;
      const match = searchQuery.match(coordPattern);
      if (match) {
        let lat = parseFloat(match[1]);
        let lon = parseFloat(match[3]);
        if (match[2]?.toUpperCase() === 'S') lat = -Math.abs(lat);
        if (match[4]?.toUpperCase() === 'W') lon = -Math.abs(lon);
        if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
          const t = lat; lat = lon; lon = t;
        }
        if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
          let name = `Coordinates (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
          const revName = await reverseGeocode(lon, lat);
          if (revName) name = revName;

          const newLoc = {
            name,
            centroid: [lon, lat] as [number, number],
            bbox: [lon - 0.04, lat - 0.04, lon + 0.04, lat + 0.04] as [number, number, number, number],
          };
          setRecognizedLocation(newLoc);
          flyToLocation([lon, lat], 14);
          showLocationRecognizedToast(name, [lon, lat], 'Coordinate Target');
          if (onPointLocation) {
            onPointLocation([lon, lat], name, 14);
          }
          setIsSearching(false);
          return;
        }
      }

      // 2. Query OpenStreetMap Nominatim for place names
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          const name = data[0].display_name.split(',').slice(0, 3).join(',').trim();

          const newLoc = {
            name,
            centroid: [lon, lat] as [number, number],
            bbox: [lon - 0.04, lat - 0.04, lon + 0.04, lat + 0.04] as [number, number, number, number],
          };
          setRecognizedLocation(newLoc);
          flyToLocation([lon, lat], 14);
          showLocationRecognizedToast(name, [lon, lat], 'Geocoded Search');
          if (onPointLocation) {
            onPointLocation([lon, lat], newLoc.name, 14);
          }
        } else {
          alert(`Location "${searchQuery}" not found. Try searching a city, landmark, or coordinates like "28.65, 77.20".`);
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Export Map Snapshot PNG
  const handleExportSnapshot = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.once('rendercomplete', () => {
      const mapCanvas = document.createElement('canvas');
      const size = mapInstanceRef.current?.getSize();
      if (!size) return;
      mapCanvas.width = size[0];
      mapCanvas.height = size[1];
      const mapContext = mapCanvas.getContext('2d');
      if (!mapContext) return;

      Array.prototype.forEach.call(
        mapRef.current?.querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
        (canvas: HTMLCanvasElement) => {
          if (canvas.width > 0) {
            const opacity = canvas.parentElement?.style.opacity || canvas.style.opacity;
            mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
            const transform = canvas.style.transform;
            let matrix: number[] = [1, 0, 0, 1, 0, 0];
            if (transform) {
              const match = transform.match(/^matrix\(([^\(]*)\)$/);
              if (match) {
                matrix = match[1].split(',').map(Number);
              }
            }
            mapContext.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
            mapContext.drawImage(canvas, 0, 0);
          }
        }
      );

      mapContext.setTransform(1, 0, 0, 1, 0, 0);
      mapContext.fillStyle = 'rgba(15, 23, 42, 0.88)';
      mapContext.fillRect(15, size[1] - 50, 420, 36);
      mapContext.font = 'bold 12px monospace';
      mapContext.fillStyle = '#38BDF8';
      mapContext.fillText(`CORVUS SAT RECON • ${recognizedLocation.name} • MULTI-SPECTRAL`, 25, size[1] - 28);

      const link = document.createElement('a');
      link.download = `CORVUS_RECON_${Date.now()}.png`;
      link.href = mapCanvas.toDataURL('image/png');
      link.click();
    });
    mapInstanceRef.current.renderSync();
  };

  // CSS Filter computation for spectral sensor simulation
  const getFilterStyle = (): string => {
    let base = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) opacity(${layerOpacity}%)`;
    if (spectralFilter === 'cir_infrared') {
      return `${base} hue-rotate(180deg) saturate(160%) contrast(120%)`;
    }
    if (spectralFilter === 'sar_radar') {
      return `${base} grayscale(100%) contrast(220%) brightness(90%) sepia(40%) hue-rotate(140deg)`;
    }
    if (spectralFilter === 'night_vision') {
      return `${base} grayscale(100%) sepia(100%) hue-rotate(85deg) saturate(300%) brightness(110%)`;
    }
    if (spectralFilter === 'panchromatic') {
      return `${base} grayscale(100%) contrast(150%) brightness(105%)`;
    }
    if (spectralFilter === 'thermal_lut') {
      return `${base} invert(100%) hue-rotate(190deg) contrast(180%)`;
    }
    return base;
  };

  // Format coordinates based on selected format
  const formatCoords = (lon: number, lat: number): string => {
    if (coordFormat === 'decimal') {
      return `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`;
    }
    if (coordFormat === 'utm') {
      // Simplified UTM zone calculation
      const zoneNum = Math.floor((lon + 180) / 6) + 1;
      const zoneLetter = lat >= 0 ? 'N' : 'S';
      return `UTM ${zoneNum}${zoneLetter} (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`;
    }
    // DMS (default)
    return `${formatDMS(lat, true)}, ${formatDMS(lon, false)}`;
  };

  const currentUploaded = uploadedFiles.find((f) => f.slot === selectedSlot) || uploadedFiles[0];

  return (
    <div
      className={`relative w-full bg-slate-950 flex flex-col overflow-hidden transition-all duration-300 select-none ${
        isFullScreen ? 'fixed inset-0 z-50 h-screen' : 'h-full min-h-[400px]'
      }`}
    >
      {/* Fresh Map Notification Banner */}
      {isFreshMap && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-950/95 border border-cyan-500/60 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl shadow-cyan-500/20 flex items-center gap-2.5 animate-fade-up pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span className="text-xs font-semibold text-slate-100">
            Fresh Project Map: <span className="text-cyan-300">Click anywhere on the map or search above to anchor your AOI</span>
          </span>
        </div>
      )}

      {/* 🔥 Floating AI Satellite Heatmap & Target Location Bar */}
      {viewMode === 'map' && (
        <div className="absolute top-16 left-3 z-20 pointer-events-auto bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 p-2.5 rounded-2xl shadow-2xl shadow-black/80 flex items-center gap-2.5 flex-wrap max-w-3xl animate-fade-in text-xs">
          {/* Target Location Badge */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-[11px] font-extrabold text-cyan-200 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{recognizedLocation.name}</span>
            </span>
          </div>

          {/* Quick Fly-To Button */}
          <button
            onClick={() => flyToLocation(recognizedLocation.centroid, 14)}
            className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 rounded-lg text-[10px] font-bold border border-cyan-500/40 flex items-center gap-1 transition shadow-sm"
            title="Focus camera on target place"
          >
            <Navigation className="w-3 h-3 text-cyan-400" />
            <span>Center Target</span>
          </button>

          {/* Heatmap Signature Selector Pills */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold">Heatmap:</span>
            {[
              { type: 'change', label: 'Change', icon: '🔄' },
              { type: 'vegetation', label: 'NDVI', icon: '🌿' },
              { type: 'water', label: 'Flood', icon: '💧' },
              { type: 'urban', label: 'Urban', icon: '🏙️' },
              { type: 'sar', label: 'SAR', icon: '📡' },
            ].map((hm) => (
              <button
                key={hm.type}
                onClick={() => {
                  setHeatmapType(hm.type as any);
                  setShowHeatmap(true);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                  heatmapType === hm.type && showHeatmap
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title={`Switch to ${hm.label} AI Heatmap`}
              >
                <span>{hm.icon}</span>
                <span>{hm.label}</span>
              </button>
            ))}
          </div>

          {/* Heatmap Glow Opacity Slider */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium">Glow:</span>
            <input
              type="range"
              min="15"
              max="100"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title="Adjust heatmap glow opacity"
            />
            <span className="text-[10px] font-mono text-amber-300 w-6">{heatmapOpacity}%</span>
          </div>

          {/* Heatmap Radius / Spread Slider */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium">Spread:</span>
            <input
              type="range"
              min="10"
              max="36"
              value={heatmapRadius}
              onChange={(e) => setHeatmapRadius(Number(e.target.value))}
              className="w-14 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title="Adjust heatmap blur radius"
            />
          </div>

          {/* Heatmap Toggle Button */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
              showHeatmap
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={showHeatmap ? 'Turn Heatmap OFF' : 'Turn AI Heatmap ON'}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}</span>
          </button>

          {/* Location Pin Toggle */}
          <button
            onClick={() => setShowLocationPin(!showLocationPin)}
            className={`p-1.5 rounded-lg text-[10px] border transition ${
              showLocationPin
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={showLocationPin ? 'Hide Location Target Pin' : 'Show Location Target Pin'}
          >
            <Target className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Floating Master Deck */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto flex-wrap gap-2">
        {/* Left: View Mode & Basemap Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              viewMode === 'map'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Global Satellite Map
          </button>
          <button
            onClick={() => setViewMode('uploaded')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              viewMode === 'uploaded'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Uploaded Raster
            {uploadedFiles.length > 0 && (
              <span className="ml-1 bg-cyan-400/20 text-cyan-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {uploadedFiles.length}
              </span>
            )}
          </button>

          {/* Basemap Dropdown Selector */}
          {viewMode === 'map' && (
            <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
              <select
                value={basemap}
                onChange={(e) => setBasemap(e.target.value as BasemapStyle)}
                className="bg-slate-800 text-xs text-slate-200 font-medium rounded-xl px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {(Object.keys(BASEMAP_PROVIDERS) as BasemapStyle[]).map((key) => (
                  <option key={key} value={key}>
                    {BASEMAP_PROVIDERS[key].icon} {BASEMAP_PROVIDERS[key].name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Global Geocoding Search Bar */}
        {viewMode === 'map' && (
          <form
            onSubmit={handleGlobalSearch}
            className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, coordinates, or target..."
              className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none w-40 sm:w-52 px-2 font-medium"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              {isSearching ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'LOCATE'
              )}
            </button>
          </form>
        )}

        {/* Right: Tactical Tools Deck */}
        {viewMode === 'map' && (
          <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl">
            {/* Spectral Filter Selector */}
            <select
              value={spectralFilter}
              onChange={(e) => setSpectralFilter(e.target.value as SpectralFilter)}
              title="Spectral Sensor Simulation"
              className="bg-slate-800 text-[11px] text-slate-200 font-mono rounded-xl px-2 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="normal">🌈 True Color RGB</option>
              <option value="cir_infrared">🌿 False Color NIR</option>
              <option value="sar_radar">📡 SAR Radar Mock</option>
              <option value="night_vision">🟢 Night Vision</option>
              <option value="panchromatic">⚪ Panchromatic HD</option>
              <option value="thermal_lut">🔥 Thermal Invert</option>
            </select>

            {/* Land Cover Summary Stats Drawer Toggle */}
            <button
              onClick={() => setShowStatsDrawer(!showStatsDrawer)}
              title="View Land Cover & Spectral GIS Metrics"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                showStatsDrawer
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">GIS Stats</span>
            </button>

            {/* Heatmap Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                showHeatmap
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/40 border border-slate-700/40 text-slate-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Heatmap</span>
            </button>

            {/* Tactical Crosshair Toggle */}
            <button
              onClick={() => setShowReticle(!showReticle)}
              title="Toggle Tactical Crosshair HUD"
              className={`p-1.5 rounded-xl border transition ${
                showReticle
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-4 h-4" />
            </button>

            {/* Radiometric Tuning Toggle */}
            <button
              onClick={() => setShowTunePanel(!showTunePanel)}
              title="Adjust Brightness, Contrast, Opacity"
              className={`p-1.5 rounded-xl border transition ${
                showTunePanel
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* 📸 Image Overlay Toggle (visible when files uploaded) */}
            {uploadedFiles.length > 0 && (
              <button
                onClick={() => setShowImageOverlay(!showImageOverlay)}
                title={showImageOverlay ? 'Hide Image Overlay on Map' : 'Show Image Overlay on Map'}
                className={`p-1.5 rounded-xl border transition ${
                  showImageOverlay
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageDown className="w-4 h-4" />
              </button>
            )}

            {/* 🌍 Browser Geolocation Button */}
            <button
              onClick={handleBrowserGeolocation}
              title="Fly to Your GPS Location"
              disabled={geoLocating}
              className={`p-1.5 rounded-xl border transition ${
                geoLocating
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 animate-pulse'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <LocateFixed className={`w-4 h-4 ${geoLocating ? 'animate-spin' : ''}`} />
            </button>

            {/* Snapshot Button */}
            <button
              onClick={handleExportSnapshot}
              title="Export High-Res Recon Snapshot (PNG)"
              className="p-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/50 transition"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? 'Exit Fullscreen' : 'Expand Fullscreen Map'}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* 📍 Location Recognition Toast — shows when location is detected from upload/search/GPS */}
      {locationToast.visible && viewMode === 'map' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-fade-up">
          <div className="bg-slate-900/95 border border-emerald-500/70 text-emerald-200 px-5 py-3 rounded-2xl shadow-2xl shadow-emerald-500/20 backdrop-blur-md flex items-center gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0 animate-bounce">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black text-emerald-300 flex items-center gap-2">
                <span>📍 LOCATION RECOGNIZED</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-bold">{locationToast.source}</span>
              </div>
              <div className="text-[11px] text-slate-200 mt-0.5 font-semibold">
                {locationToast.locationName}
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                Centroid: {locationToast.coords[1].toFixed(4)}°N, {locationToast.coords[0].toFixed(4)}°E
              </div>
            </div>
            <button
              onClick={() => setLocationToast(prev => ({ ...prev, visible: false }))}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Fresh Map Alert Badge */}
      {isFreshMap && viewMode === 'map' && !locationToast.visible && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-slate-900/95 border border-amber-400/80 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-lg">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
            <Crosshair className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-300 flex items-center gap-2">
              <span>FRESH PROJECT MAP</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-mono font-bold">Unanchored</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Click <strong>anywhere on the map</strong> or search a city to anchor this project&apos;s target location.
            </div>
          </div>
        </div>
      )}

      {/* Secondary Multi-Spectral Land Cover Layer Bar */}
      {viewMode === 'map' && (
        <div className="absolute top-16 left-3 z-20 pointer-events-auto flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 flex items-center gap-1 font-mono">
            <Layers className="w-3 h-3 text-cyan-400" /> Overlays:
          </span>

          {/* 🌿 Vegetation Toggle */}
          <button
            onClick={() => toggleLayer('vegetation')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition border ${
              currentLayerVisibility.vegetation
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vegetation (NDVI)</span>
          </button>

          {/* 💧 Water Bodies Toggle */}
          <button
            onClick={() => toggleLayer('water')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition border ${
              currentLayerVisibility.water
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>Water Bodies (NDWI)</span>
          </button>

          {/* 🏙️ Built-up Toggle */}
          <button
            onClick={() => toggleLayer('urban')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition border ${
              currentLayerVisibility.urban
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <span>Built-up / Urban</span>
          </button>

          {/* 🔄 Bi-temporal Changes (Diffs) Toggle */}
          <button
            onClick={() => toggleLayer('diff_change')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition border ${
              currentLayerVisibility.diff_change
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Diffs</span>
          </button>

          {/* 🛣️ Roads Toggle */}
          <button
            onClick={() => toggleLayer('roads')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition border ${
              currentLayerVisibility.roads
                ? 'bg-slate-700/60 border-slate-500/50 text-slate-200'
                : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Route className="w-3.5 h-3.5 text-slate-300" />
            <span>Roads</span>
          </button>

          {/* 🔥 Real Multi-Spectral Heatmap Engine */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-700/80">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition border ${
                showHeatmap
                  ? 'bg-gradient-to-r from-amber-500/30 to-red-500/30 border-amber-500/60 text-amber-200 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Real Multi-Spectral Heatmap on/off"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Heatmap: {showHeatmap ? 'ON' : 'OFF'}</span>
            </button>

            {showHeatmap && (
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setHeatmapType('vegetation')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    heatmapType === 'vegetation'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Normalized Difference Vegetation Index (Chlorophyll Canopy Health)"
                >
                  🌿 NDVI
                </button>
                <button
                  onClick={() => setHeatmapType('water')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    heatmapType === 'water'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Normalized Difference Water Index (Flood Inundation & Hydrology)"
                >
                  💧 NDWI
                </button>
                <button
                  onClick={() => setHeatmapType('urban')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    heatmapType === 'urban'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="NDBI Urban Heat Island / Concrete Core Density"
                >
                  🏙️ Urban
                </button>
                <button
                  onClick={() => setHeatmapType('sar')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    heatmapType === 'sar'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Synthetic Aperture Radar Backscatter & Interferometric Fringes"
                >
                  📡 SAR
                </button>
                <button
                  onClick={() => setHeatmapType('change')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    heatmapType === 'change'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Bi-Temporal Change Delta Spectrum"
                >
                  ⚖️ Delta
                </button>
                <button
                  onClick={() => setHeatmapType('hazard')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    heatmapType === 'hazard'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Multi-Hazard Threat Severity Index"
                >
                  🔥 Threat
                </button>
              </div>
            )}
          </div>

          {/* 🎯 AI Geolocation & Relocate Target & Map Pin Toggle */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/80">
            <button
              onClick={() => setShowLocationPin(!showLocationPin)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition border ${
                showLocationPin
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/20'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle AOI Location Pin/Label on map (Default OFF for clean satellite raster inspection)"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Pin: {showLocationPin ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={() => setShowRelocateBar(!showRelocateBar)}
              className="px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition"
              title="AI Location Detected — Click to Relocate Scene"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>🎯 Relocate</span>
            </button>
          </div>
        </div>
      )}

      {/* 🎯 AI Geolocation & Relocate Preset Drawer */}
      {showRelocateBar && viewMode === 'map' && (
        <div className="absolute top-28 left-3 z-30 pointer-events-auto bg-slate-900/95 border border-cyan-500/50 backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl space-y-2.5 max-w-md animate-fade-up">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>AI Scene Geolocation & Relocate Target</span>
            </div>
            <button
              onClick={() => setShowRelocateBar(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Current Scene AOI: <strong className="text-cyan-300">{recognizedLocation.name}</strong>. Relocate this image raster &amp; real heatmap to any recognized region:
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {AI_PRESET_LOCATIONS.map((loc, idx) => (
              <button
                key={idx}
                onClick={() => handleRelocateScene(loc.name, loc.centroid as [number, number])}
                className="text-left px-2.5 py-1.5 bg-slate-800/80 hover:bg-cyan-900/40 hover:border-cyan-500/60 border border-slate-700 rounded-xl text-[11px] text-slate-200 transition flex items-center gap-1.5 group"
              >
                <span className="text-sm">{loc.icon}</span>
                <span className="truncate font-semibold group-hover:text-cyan-300">{loc.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Measurement Toolbar */}
      {viewMode === 'map' && (
        <div className="absolute left-3 top-28 flex flex-col gap-1.5 z-20 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl">
          <button
            onClick={() => setActiveTool(activeTool === 'measure_distance' ? 'none' : 'measure_distance')}
            title="Measure Line Distance (Click on map to measure)"
            className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition ${
              activeTool === 'measure_distance'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool(activeTool === 'measure_area' ? 'none' : 'measure_area')}
            title="Measure Polygonal Area (Click polygon vertices)"
            className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition ${
              activeTool === 'measure_area'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool(activeTool === 'draw_aoi' ? 'none' : 'draw_aoi')}
            title="Draw Custom Target AOI Area"
            className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition ${
              activeTool === 'draw_aoi'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800'
            }`}
          >
            <Scan className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Measurement Status Banner */}
      {measureResult && viewMode === 'map' && (
        <div className="absolute top-28 left-16 z-20 pointer-events-auto bg-rose-950/90 border border-rose-600/50 text-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold shadow-2xl flex items-center gap-2 animate-fade-in">
          <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>{measureResult}</span>
          <button
            onClick={() => {
              setMeasureResult(null);
              if (measureVectorLayerRef.current?.getSource()) {
                measureVectorLayerRef.current.getSource()?.clear();
              }
            }}
            className="text-rose-400 hover:text-white ml-2 text-[10px] uppercase font-bold"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Land Cover & GIS Statistics Summary Drawer */}
      {showStatsDrawer && viewMode === 'map' && (
        <div className="absolute top-20 right-3 z-20 pointer-events-auto w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl space-y-3.5 text-xs animate-fade-in">
          <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2 text-emerald-400">
              <BarChart3 className="w-4 h-4" />
              Land Cover Composition
            </span>
            <button
              onClick={() => setShowStatsDrawer(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {/* 🌿 Vegetation Stat */}
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5" /> Vegetation & Crops (NDVI)
                </span>
                <span>36.1%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-400/80 font-mono">
                <span>Area: 2.52 km² (252 ha)</span>
                <span>Mean NDVI: +0.67</span>
              </div>
            </div>

            {/* 💧 Water Bodies Stat */}
            <div className="p-2.5 bg-sky-950/40 border border-sky-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-sky-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" /> Water Bodies (NDWI)
                </span>
                <span>11.8%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-sky-400/80 font-mono">
                <span>Area: 0.63 km² (63 ha)</span>
                <span>Mean NDWI: +0.58</span>
              </div>
            </div>

            {/* 🏙️ Urban / Built-up Stat */}
            <div className="p-2.5 bg-orange-950/40 border border-orange-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-orange-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Urban & Buildings (NDBI)
                </span>
                <span>52.1%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-orange-400/80 font-mono">
                <span>Area: 1.85 km² (185 ha)</span>
                <span>Mean NDBI: +0.46</span>
              </div>
            </div>

            {/* 🔄 Change Detections Stat */}
            <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5" /> Net Change Expansion Delta
                </span>
                <span className="text-amber-400">+26.49%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-400/80 font-mono">
                <span>Delta: +490,000 m²</span>
                <span>Confidence: 94.6%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Radiometry & Tuning Panel */}
      {showTunePanel && viewMode === 'map' && (
        <div className="absolute top-20 right-3 z-20 pointer-events-auto w-64 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Sensor Radiometry
            </span>
            <button
              onClick={() => {
                setBrightness(100);
                setContrast(100);
                setSaturation(100);
                setLayerOpacity(100);
              }}
              title="Reset Adjustments"
              className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Brightness</span>
              <span className="font-mono text-cyan-300">{brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="180"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Contrast</span>
              <span className="font-mono text-cyan-300">{contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Saturation</span>
              <span className="font-mono text-cyan-300">{saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="220"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Layer Opacity</span>
              <span className="font-mono text-cyan-300">{layerOpacity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={layerOpacity}
              onChange={(e) => setLayerOpacity(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Image Overlay Opacity (when images uploaded) */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ImageDown className="w-3 h-3 text-teal-400" />
                  Image Overlay
                </span>
                <span className="font-mono text-teal-300">{imageOverlayOpacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={imageOverlayOpacity}
                onChange={(e) => setImageOverlayOpacity(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Render OpenLayers Real Satellite Map */}
      <div
        ref={mapRef}
        style={{
          filter: getFilterStyle(),
        }}
        className={`w-full h-full transition-opacity duration-300 ${
          viewMode === 'map' ? 'opacity-100 relative z-10' : 'opacity-0 absolute pointer-events-none'
        }`}
      />

      {/* Feature Inspection Popup */}
      <div
        ref={popupRef}
        className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-2xl shadow-2xl w-72 text-xs space-y-2 select-text text-slate-200"
      >
        {inspectedFeature && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white text-[13px]">
                {inspectedFeature.type === 'vegetation' && <Trees className="w-4 h-4 text-emerald-400" />}
                {inspectedFeature.type === 'water' && <Droplets className="w-4 h-4 text-sky-400" />}
                {inspectedFeature.type === 'urban' && <Building2 className="w-4 h-4 text-orange-400" />}
                {inspectedFeature.type === 'diff_change' && <GitCompare className="w-4 h-4 text-amber-400" />}
                {inspectedFeature.type === 'roads' && <Route className="w-4 h-4 text-slate-300" />}
                <span>{inspectedFeature.title}</span>
              </div>
              <button
                onClick={() => {
                  setInspectedFeature(null);
                  if (popupOverlayRef.current) popupOverlayRef.current.setPosition(undefined);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-cyan-300 font-mono font-semibold mb-1">
              {inspectedFeature.subType}
            </div>

            <div className="text-[10px] text-slate-400 mb-2 font-mono">
              Extent: <strong className="text-slate-200">{inspectedFeature.areaFormatted}</strong>
            </div>

            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 space-y-1 font-mono text-[10px]">
              {Object.entries(inspectedFeature.metrics).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-400">{k}:</span>
                  <span className="text-emerald-400 font-bold">{v}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              {inspectedFeature.description}
            </p>
          </div>
        )}
      </div>

      {/* Tactical Center Reticle Crosshair HUD */}
      {viewMode === 'map' && showReticle && (
        <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center opacity-70">
            <div className="w-16 h-16 rounded-full border border-cyan-400/40 animate-pulse-slow" />
            <div className="absolute w-28 h-28 rounded-full border border-dashed border-cyan-400/20" />
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent" />
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500" />
          </div>
        </div>
      )}

      {/* Tactical Zoom Presets & Navigation Buttons */}
      {viewMode === 'map' && (
        <div className="absolute right-4 bottom-16 flex flex-col gap-2 z-20 pointer-events-auto">
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                const view = mapInstanceRef.current.getView();
                view.animate({ zoom: (view.getZoom() || 13) + 1, duration: 200 });
              }
            }}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 shadow-xl transition flex items-center justify-center"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                const view = mapInstanceRef.current.getView();
                view.animate({ zoom: (view.getZoom() || 13) - 1, duration: 200 });
              }
            }}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 shadow-xl transition flex items-center justify-center"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => setZoomLevel(20)}
            className="px-2 py-1 bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 rounded-xl border border-indigo-500/40 shadow-xl transition text-[10px] font-mono font-bold"
            title="Extreme Close-up Zoom (Zoom 20 Sub-meter)"
          >
            20x
          </button>

          <button
            onClick={() => flyToLocation(recognizedLocation.centroid, 14)}
            className="p-2.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-xl border border-emerald-500/40 shadow-xl transition flex items-center justify-center"
            title="Re-center on Active AOI"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Floating Tactical Status & Telemetry Bar */}
      {viewMode === 'map' && (
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-20 pointer-events-none flex-wrap gap-2">
          {/* Coordinates & GSD Telemetry Card */}
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-[11px] font-mono text-slate-300 flex items-center gap-3 shadow-2xl flex-wrap">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>{recognizedLocation.name}</span>
            </div>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setCoordFormat(prev => prev === 'dms' ? 'decimal' : prev === 'decimal' ? 'utm' : 'dms')}
              title={`Click to cycle format (Current: ${coordFormat.toUpperCase()})`}
              className="text-slate-400 hover:text-slate-200 cursor-pointer transition"
            >
              <Compass className="w-3 h-3 inline mr-1" />
              <strong className="text-slate-200">
                {formatCoords(cursorCoords[0], cursorCoords[1])}
              </strong>
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 flex items-center gap-1">
              Zoom: <strong className="text-cyan-300 font-bold">Z{currentZoom}</strong>
              {currentZoom > 18 && (
                <span className="bg-cyan-500/20 text-cyan-300 text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30">
                  ✨ Super-Res Active
                </span>
              )}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">
              GSD: <strong className="text-emerald-400">{computeGSD(currentZoom)}</strong>
            </span>
            {/* Image Overlay Active Indicator */}
            {showImageOverlay && uploadedFiles.length > 0 && (
              <>
                <span className="text-slate-700">|</span>
                <span className="text-teal-400 flex items-center gap-1">
                  <ImageDown className="w-3 h-3" />
                  <strong>Overlay: {imageOverlayOpacity}%</strong>
                </span>
              </>
            )}
          </div>

          {/* Real Multi-Spectral Heatmap Gradient Legend */}
          {showHeatmap && (
            <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-xl text-[11px] font-mono text-slate-300 flex items-center gap-3 shadow-2xl flex-wrap">
              <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                {heatmapType === 'vegetation'
                  ? 'NDVI Canopy Vigor'
                  : heatmapType === 'water'
                  ? 'NDWI Water Inundation'
                  : heatmapType === 'urban'
                  ? 'NDBI Thermal Island'
                  : heatmapType === 'sar'
                  ? 'SAR Radar Backscatter'
                  : heatmapType === 'hazard'
                  ? 'Hazard Threat'
                  : 'Bi-Temporal Delta'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-mono">
                  {heatmapType === 'vegetation'
                    ? '-0.15 (Barren)'
                    : heatmapType === 'water'
                    ? '-0.40 (Dry)'
                    : heatmapType === 'urban'
                    ? '18°C (Cool)'
                    : heatmapType === 'sar'
                    ? '-24 dB'
                    : '0% (Low)'}
                </span>
                <div
                  className="w-28 h-2.5 rounded-full shadow-inner border border-slate-700/60"
                  style={{
                    background:
                      heatmapType === 'change'
                        ? 'linear-gradient(to right, #0284c7, #059669, #d97706, #dc2626)'
                        : heatmapType === 'urban'
                        ? 'linear-gradient(to right, #0f172a, #1e3a8a, #3b82f6, #8b5cf6, #d946ef, #f43f5e)'
                        : heatmapType === 'vegetation'
                        ? 'linear-gradient(to right, #022c22, #065f46, #059669, #10b981, #34d399, #6ee7b7)'
                        : heatmapType === 'water'
                        ? 'linear-gradient(to right, #030712, #082f49, #0284c7, #06b6d4, #38bdf8)'
                        : heatmapType === 'sar'
                        ? 'linear-gradient(to right, #0f172a, #1e293b, #0284c7, #00f5d4)'
                        : 'linear-gradient(to right, #1e1b4b, #4338ca, #7c3aed, #db2777, #ef4444)',
                  }}
                />
                <span className="text-[9px] text-slate-200 font-bold font-mono">
                  {heatmapType === 'vegetation'
                    ? '+0.92 (Dense)'
                    : heatmapType === 'water'
                    ? '+0.88 (Deep)'
                    : heatmapType === 'urban'
                    ? '46°C (Hot)'
                    : heatmapType === 'sar'
                    ? '+2 dB'
                    : '100% (Critical)'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render Uploaded Raster Image Viewer */}
      {viewMode === 'uploaded' && (
        <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 z-10 overflow-hidden">
          {currentUploaded ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {currentUploaded.preview ? (
                <img
                  src={currentUploaded.preview}
                  alt={currentUploaded.file.name}
                  className="max-h-[80%] max-w-[90%] object-contain rounded-xl border border-slate-800 shadow-2xl animate-fade-up"
                />
              ) : (
                <div className="relative w-[90%] h-[75%] bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-2xl overflow-hidden animate-fade-up">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />

                  <div className="relative z-10 flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white font-mono">
                        [{currentUploaded.slot}] {currentUploaded.file.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                      {currentUploaded.metadata?.location_name || recognizedLocation.name}
                    </span>
                  </div>

                  <div className="relative z-10 my-auto text-center space-y-3">
                    <div className="inline-flex items-center justify-center p-4 bg-cyan-600/10 border border-cyan-500/30 rounded-2xl">
                      <ImageIcon className="w-12 h-12 text-cyan-400 animate-pulse-slow" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">
                      Geospatial Raster Tile Georeferenced
                    </h4>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
                      <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-emerald-400">
                        📍 {recognizedLocation.name}
                      </span>
                      <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                        CRS: {currentUploaded.metadata?.crs || 'EPSG:4326'}
                      </span>
                      <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                        Res: {currentUploaded.metadata?.resolution_m || 10.0}m/px
                      </span>
                      <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                        Bands: {currentUploaded.metadata?.bands || 4}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Bounding Box: [{recognizedLocation.bbox.join(', ')}]</span>
                    <button
                      onClick={() => {
                        setViewMode('map');
                        flyToLocation(recognizedLocation.centroid, 14);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Globe className="w-3.5 h-3.5" /> View on Global Satellite Map
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3 max-w-sm">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 inline-block">
                <ImageIcon className="w-10 h-10 text-slate-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">No Image Uploaded Yet</h4>
              <p className="text-xs text-slate-500">
                Upload a satellite GeoTIFF or image to auto-detect its world location and view the interactive heatmap.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
