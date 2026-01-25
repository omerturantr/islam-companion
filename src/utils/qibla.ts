const KAABA = {
  latitude: 21.422487,
  longitude: 39.826206,
};

const toRadians = (value: number) => (value * Math.PI) / 180;
const toDegrees = (value: number) => (value * 180) / Math.PI;

export const getQiblaBearing = (latitude: number, longitude: number) => {
  const phi1 = toRadians(latitude);
  const phi2 = toRadians(KAABA.latitude);
  const deltaLambda = toRadians(KAABA.longitude - longitude);

  const y = Math.sin(deltaLambda);
  const x =
    Math.cos(phi1) * Math.tan(phi2) -
    Math.sin(phi1) * Math.cos(deltaLambda);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
};

export const getCardinalDirection = (bearing: number) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % directions.length;
  return directions[index];
};
