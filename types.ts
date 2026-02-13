
export interface Client {
  id: string;
  name: string;
  address: string;
  industry: string;
  revenue: number;
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  confidence: number;
  formattedAddress: string;
}

export interface StrategicInsight {
  summary: string;
  recommendations: string[];
  hotspots: string[];
  riskAreas: string[];
}
