import * as React from 'react';
import { DataSourceConnector, IDataSourceDictionary } from '../../data-sources';

export interface IGenericProps {
  title: string;
  subtitle: string;
  dependencies: { [key: string] : string };
  actions: { [key: string] : IAction };
  props: { [key: string] : Object };
  layout: {
    "x": number;
    "y": number;
    "w": number;
    "h": number;
  }
}

export interface IGenericState { [key: string] : any }

export abstract class GenericComponent<T1 extends IGenericProps, T2 extends IGenericState> extends React.Component<T1, T2> {
  // static propTypes = {}
  // static defaultProps = {}

  constructor(props) {
    super(props);

    this.onStateChange = this.onStateChange.bind(this);
    this.trigger = this.trigger.bind(this);

    var result = DataSourceConnector.extrapolateDependencies(this.props.dependencies);
    var initialState: IGenericState = {};
    Object.keys(result.dependencies).forEach(key => {
      initialState[key] = result.dependencies[key];
    });

    this.state = initialState as any;
  }

  componentDidMount() {
    var result = DataSourceConnector.extrapolateDependencies(this.props.dependencies);
    Object.keys(result.dataSources).forEach(key => {

      // Setting initial state to make sure state is updated to the store before future changes
      this.onStateChange(result.dataSources[key].store.state);

      // Listening to future changes in dependant stores
      result.dataSources[key].store.listen(this.onStateChange);
    });
  }

  componentWillUnmount() {
    var result = DataSourceConnector.extrapolateDependencies(this.props.dependencies);
    Object.keys(result.dataSources).forEach(key => {
      result.dataSources[key].store.unlisten(this.onStateChange);
    });
  }

  private onStateChange(state) {

    var result = DataSourceConnector.extrapolateDependencies(this.props.dependencies);
    var updatedState: IGenericState = {};
    Object.keys(result.dependencies).forEach(key => {
      updatedState[key] = result.dependencies[key];
    });

    this.setState(updatedState);
  }

  protected trigger(actionName: string, args: IDictionary) {
    var action = this.props.actions[actionName];

    // if action was not defined, not action needed
    if (!action) {
      console.warn(`no action was found with name ${name}`);
      return;
    }

    var actionId = typeof action === 'string' ? action : action.action;
    var params = typeof action === 'string' ? {} : action.params;
    DataSourceConnector.triggerAction(actionId, params, args);
  }

  abstract render();
}