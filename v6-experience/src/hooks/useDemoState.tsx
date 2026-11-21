import React, { createContext, useContext, useMemo, useState } from 'react';
import type { SeasonId } from '../data/catalog';

export type SwingState = 'available' | 'occupied' | 'closed';
export type DeviceStatus = 'ready' | 'busy' | 'fault';
export type StockStatus = 'full' | 'current_empty' | 'all_empty';
export type WeatherStatus = 'normal' | 'wind_rain';
export type TrayStatus = 'empty' | 'occupied';
export type DropOutcome = 'normal' | 'zero' | 'jam' | 'double' | 'off_target';

export interface DemoConfig {
  demoMode: boolean;
  season: SeasonId;
  swingState: SwingState;
  deviceStatus: DeviceStatus;
  stockStatus: StockStatus;
  weatherStatus: WeatherStatus;
  trayStatus: TrayStatus;
  dropOutcome: DropOutcome;
  postOfficeOpen: boolean;
  muted: boolean;
}

interface DemoContextValue {
  config: DemoConfig;
  setField: <K extends keyof DemoConfig>(key: K, value: DemoConfig[K]) => void;
  resetDemoDefaults: () => void;
  isLeafDropPaused: boolean;
  leafDropPauseReason: string | null;
}

function readInitialConfig(): DemoConfig {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const seasonParam = params.get('season');
  const season: SeasonId =
    seasonParam === 'spring' || seasonParam === 'summer' || seasonParam === 'autumn' || seasonParam === 'winter'
      ? seasonParam
      : 'spring';

  return {
    demoMode: params.get('demo') === '1',
    season,
    swingState: 'available',
    deviceStatus: 'ready',
    stockStatus: 'full',
    weatherStatus: 'normal',
    trayStatus: 'empty',
    dropOutcome: 'normal',
    postOfficeOpen: true,
    muted: false,
  };
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<DemoConfig>(readInitialConfig);

  const setField = <K extends keyof DemoConfig>(key: K, value: DemoConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const resetDemoDefaults = () => {
    setConfig((prev) => ({
      ...readInitialConfig(),
      demoMode: prev.demoMode,
    }));
  };

  const { isLeafDropPaused, leafDropPauseReason } = useMemo(() => {
    if (config.weatherStatus === 'wind_rain') {
      return { isLeafDropPaused: true, leafDropPauseReason: '当前有风或降雨，实体领卡已暂缓' };
    }
    if (config.deviceStatus === 'fault') {
      return { isLeafDropPaused: true, leafDropPauseReason: '设备待工作人员检修，暂不可领卡' };
    }
    if (config.trayStatus === 'occupied') {
      return { isLeafDropPaused: true, leafDropPauseReason: '侧边取卡盘尚有余卡，待清盘后开放' };
    }
    return { isLeafDropPaused: false, leafDropPauseReason: null };
  }, [config.weatherStatus, config.deviceStatus, config.trayStatus]);

  const value = useMemo(
    () => ({ config, setField, resetDemoDefaults, isLeafDropPaused, leafDropPauseReason }),
    [config, isLeafDropPaused, leafDropPauseReason]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoState() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemoState must be used within DemoProvider');
  return ctx;
}
