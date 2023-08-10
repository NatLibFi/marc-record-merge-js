import Reducers from './reducers';
import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge:index');
const debugData = debug.extend('data');

export {Reducers};
// export default ({base, source, reducers}) => reducers.reduce((base, reducer) => reducer(base, source), base);

// NV: Modified the reducer loop so, that not only base, but also is carried back.
// However, we try to be backward-compatible: normally after the reducers, only base is returned.

export default ({base, source, reducers}) => {

  const combo = {base, source};
  const resultCombo = reducers.reduce((combo, reducer) => {
    const returnCombo = singleRound(reducer, combo.base, combo.source);
    //debugData(`returnCombo after current reducer: ${JSON.stringify(returnCombo)}`);
    return returnCombo;
  }, combo);

  debugData(`ResultCombo after reducers: ${JSON.stringify(resultCombo)}`);

  // Hack to make my melinda-marc-record-merge-reducers single tests that expect both
  // base and source to return them both:
  if (reducers.length === 1 && resultCombo.base && resultCombo.source) {
    debug('Single reducer, returning resultCombo');
    debugData(JSON.stringify(resultCombo));

    return resultCombo;
  }
  // All other tests return just base... Backward (compability) it is!
  debug('Multiple reducers, returning just base');
  debugData(JSON.stringify(resultCombo.base));
  return resultCombo.base;

  function singleRound(reducer, base, source) {
    //debug(`SINGLE ROUND INPUT (base, source)`);
    //debugData(base);
    //debugData(base);
    const reducerResult = reducer(base, source);
    //debug(`reducerResult:`);
    //debugData(reducerResult);
    if (reducerResult.base !== undefined && reducerResult.source !== undefined) {
      debug('NEW STYLE REDUCER RESULT v2');
      const combo = reducerResult;
      //debugData(combo);
      return combo;
    }
    debug('OLD SCHOOL REDUCER RESULT v2');
    //debugData({base: reducerResult, source});
    return {base: reducerResult, source};
  }
};
