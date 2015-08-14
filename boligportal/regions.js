import _ from 'lodash';

const regions = {
  copenhagen: '4',
  aarhus: '14',
  test: '15'
};

function RegionException(message) {
  this.message = message;
  this.name = 'RegionException';
}

export function regionToId(name) {
  if (_.has(regions, name.toLowerCase())) {
    return regions[name.toLowerCase()];
  }
  throw new RegionException(`Could not find a region id for ${name}`);
}
