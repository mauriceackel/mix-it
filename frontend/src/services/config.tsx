import React, {
  PropsWithChildren,
  ReactElement,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

interface SetEditEnabledAction {
  type: 'SET_EDIT_ENABLED';
  enabled: boolean;
}

interface SetHostAction {
  type: 'SET_HOST';
  host: string;
}

interface SetPortAction {
  type: 'SET_PORT';
  port: number;
}

interface SetTrackCountAction {
  type: 'SET_TRACK_COUNT';
  trackCount: number;
}

interface SetAutoUpdateAction {
  type: 'SET_AUTO_UPDATE';
  autoUpdate: boolean;
}

interface OverwriteAction {
  type: 'OVERWRITE';
  state: ConfigStateModel;
}

type ConfigAction =
  | SetEditEnabledAction
  | SetHostAction
  | SetPortAction
  | SetTrackCountAction
  | SetAutoUpdateAction
  | OverwriteAction;

interface ConfigStateModel {
  editEnabled: boolean;
  host: string;
  port: number;
  autoUpdate: boolean;
  trackCount: number;
}

interface ConfigContextModel extends ConfigStateModel {
  dispatch: React.Dispatch<ConfigAction>;
}

function configReducer(
  currentState: ConfigStateModel,
  action: ConfigAction,
): ConfigStateModel {
  switch (action.type) {
    case 'OVERWRITE': {
      return action.state;
    }
    case 'SET_EDIT_ENABLED': {
      return {
        ...currentState,
        editEnabled: action.enabled,
      };
    }
    case 'SET_HOST': {
      return {
        ...currentState,
        host: action.host,
      };
    }
    case 'SET_PORT': {
      return {
        ...currentState,
        port: action.port,
      };
    }
    case 'SET_TRACK_COUNT': {
      return {
        ...currentState,
        trackCount: action.trackCount,
      };
    }
    case 'SET_AUTO_UPDATE': {
      return {
        ...currentState,
        autoUpdate: action.autoUpdate,
      };
    }
    default: {
      return currentState;
    }
  }
}

const defaultState: ConfigStateModel = {
  editEnabled: false,
  host: '0.0.0.0',
  port: 8000,
  autoUpdate: true,
  trackCount: 3,
};
export const defaultContext: ConfigContextModel = {
  ...defaultState,
  dispatch: () => {},
};

const ConfigContext = React.createContext<ConfigContextModel>(defaultContext);
export default ConfigContext;

export function ConfigContextProvider(
  props: PropsWithChildren<unknown>,
): ReactElement {
  const { children } = props;

  const [state, dispatch] = useReducer(configReducer, defaultState);

  // Load data from localStorage
  useEffect(() => {
    const rawData = localStorage.getItem('configState');
    if (!rawData) return;

    const loadedState: ConfigStateModel = JSON.parse(rawData);

    dispatch({ type: 'OVERWRITE', state: loadedState });
  }, []);

  // Store data to localStorage
  useEffect(() => {
    localStorage.setItem('configState', JSON.stringify(state));
  }, [state]);

  const contextValue = useMemo(
    () => ({ ...state, dispatch }),
    [state, dispatch],
  );

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}
