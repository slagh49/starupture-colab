export interface MapMarker {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
  createdBy: string | null;
  createdAt: string | null;
}

export interface MarkerInput {
  x: number;
  y: number;
  label: string;
  color: string;
}
