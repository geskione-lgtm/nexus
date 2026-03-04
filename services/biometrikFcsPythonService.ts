
export interface MorphWeights {
  head_roundness: number;
  occiput_back: number;
  forehead_slope: number;
  chin_projection: number;
  jaw_width: number;
  nose_length: number;
  nose_angle_up: number;
  eye_spacing: number;
}

export interface WeightsRequest {
  clinic_id?: string;
  patient_id?: string;
  session_id?: string;
  ga_weeks: number;
  bpd_mm?: number;
  hc_mm?: number;
  nb_mm?: number;
  chin_mm?: number;
  jaw_mm?: number;
  seed?: number;
  template?: string;
}

export interface WeightsResponse {
  weights: MorphWeights;
  warnings: string[];
  meta: {
    ga_weeks: number;
    seed?: number;
  };
}

const API_URL = import.meta.env.VITE_BIOMETRIK_FCS_API_URL || 'http://localhost:8001';

export const biometrikFcsPythonService = {
  async getWeights(request: WeightsRequest): Promise<WeightsResponse> {
    try {
      const response = await fetch(`${API_URL}/biometrik-fcs/weights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch morph weights');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Biometrik FCS Python Service:', error);
      throw error;
    }
  }
};
