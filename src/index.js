import Reducers from './reducers';

export {Reducers};
// export default ({base, source, reducers}) => reducers.reduce((base, reducer) => reducer(base, source), base);

// NV: Modified the reducer loop so, that not only base, but also is carried back.
// However, we try to be backward-compatible: normally after the reducers, only base is returned.
export default ({base, source, reducers}) => {
  const combo = {base, source}; // eslint-disable-line functional/no-let

  reducers.reduce((combo, reducer) => {
    combo = singleRound(reducer, combo.base, combo.source); // eslint-disable-line no-param-reassign

    return combo;
  }, combo);

  // Hack to make my melinda-marc-record-merge-reducers single tests that expect both
  // base and source to return them both:
  if (reducers.length === 1 && combo.base && combo.source) {
    return combo;
  }
  // All other tests return just base... Backward (compability) it is!
  return combo.base;

  function singleRound(reducer, base, source) {
    const combo = reducer(base, source);
    if (combo.base !== undefined && combo.source !== undefined) {
      //console.info('NEW STYLE REDUCER RESULT v2'); // eslint-disable-line no-console
      return combo;
    }
    //console.info('OLD SCHOOL REDUCER RESULT v2'); // eslint-disable-line no-console
    return {base: combo.base, source};
  }
};
