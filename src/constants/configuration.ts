export const CONTROLLERS_PER_PAGE = 10;

export const IPV4_ADDRESS_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export const isGen5Generation = (generation?: string) => {
  if (!generation) {
    return false;
  }
  return generation.toLowerCase().replace(/\s+/g, '') === 'gen5';
};

export const isGen3Generation = (generation?: string) => {
  if (!generation) {
    return false;
  }
  return generation.toLowerCase().replace(/\s+/g, '') === 'gen3';
};
