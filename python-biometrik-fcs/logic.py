from typing import Dict, Optional, List
import math

def calculate_morph_weights(
    ga_weeks: float,
    bpd_mm: Optional[float],
    hc_mm: Optional[float],
    nb_mm: Optional[float],
    chin_mm: Optional[float],
    jaw_mm: Optional[float],
    seed: Optional[int] = None
) -> Dict[str, float]:
    """
    Deterministically maps biometric measurements to morph weights (0.0 to 1.0).
    """
    
    # Placeholder nomograms (TODO: Replace with real medical data)
    # Expected values for 23 weeks as a baseline
    baseline_ga = 23.0
    expected_bpd = 56.0
    expected_hc = 210.0
    expected_nb = 12.0
    expected_chin = 10.0
    expected_jaw = 30.0

    # Simple linear scaling for expected values based on GA
    # (Simplified for this microservice implementation)
    ga_factor = ga_weeks / baseline_ga
    target_bpd = expected_bpd * ga_factor
    target_hc = expected_hc * ga_factor
    target_nb = expected_nb * ga_factor
    target_chin = expected_chin * ga_factor
    target_jaw = expected_jaw * ga_factor

    def normalize(val: Optional[float], target: float, sensitivity: float = 0.2) -> float:
        if val is None:
            return 0.5 # Neutral
        # Calculate delta from expected
        delta = (val - target) / target
        # Map to 0..1 range with 0.5 as neutral
        weight = 0.5 + (delta / sensitivity)
        return max(0.0, min(1.0, weight))

    # Calculate weights
    weights = {
        "head_roundness": normalize(bpd_mm, target_bpd),
        "occiput_back": normalize(hc_mm, target_hc),
        "forehead_slope": 0.5, # Placeholder for more complex logic
        "chin_projection": normalize(chin_mm, target_chin),
        "jaw_width": normalize(jaw_mm, target_jaw),
        "nose_length": normalize(nb_mm, target_nb),
        "nose_angle_up": 0.5, # Placeholder
        "eye_spacing": 0.5 # Placeholder
    }

    # Apply seed-based deterministic variation if provided
    if seed is not None:
        # Use a simple deterministic "random" based on seed
        # This ensures the same seed always produces the same variation
        variation = (math.sin(seed) + 1) / 2 # 0..1
        weights["forehead_slope"] = 0.4 + (variation * 0.2)

    return weights
