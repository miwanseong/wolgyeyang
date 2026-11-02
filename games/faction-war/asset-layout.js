// Authored source pixel bounds; no resampling or modification of generated images.
export const fishAtlasRows=[[0, 225, 437, 634, 878, 1077, 1298, 1510, 1774], [0, 200, 388, 562, 778, 959, 1142, 1298, 1493], [0, 190, 369, 532, 768, 954, 1130, 1310, 1536], [0, 192, 384, 576, 768, 960, 1152, 1344, 1536]];
export const directionRows=[0,250,465,681,887];
export const dodgeRows=[155,445,700,940,1232];

// Generated fishing atlas: preserve authored row baselines rather than clipping feet.
export const fishingMotionRows=[0,245,466,680,887];
export const farmingMotionRows=[0,273,484,701,887];
export const farmingFootRows=[253,468,686,880];

export const diagonalRows=[0,252,465,681,887];
export function diagonalFrame(direction,phase=0){return {column:({southeast:0,southwest:2,northeast:4,northwest:4})[direction]+phase,mirror:direction==='northwest'};}
