import Reducers from './reducers';

export {Reducers};
export default ({base, source, reducers}) => reducers.reduce((base, reducer) => reducer(base, source), base);
