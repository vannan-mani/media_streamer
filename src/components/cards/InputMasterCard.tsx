import React, { useMemo } from 'react';
import NestedCard from '../common/NestedCard';
import GlassCard from '../common/GlassCard';
import { Activity, AlertCircle, Radio } from 'lucide-react';
import '../layout/ControlStack.css';

interface Device {
    device_number: number;
    name: string;
    inputs: InputPort[];
    status?: string;
}

interface InputPort {
    id: string;
    port: string;
    signal_detected: boolean;
    format: string | null;
    device_number: number;
}

interface InputMasterCardProps {
    devices: Device[];
    selectedDeviceId: number;
    onSelect: (deviceId: number) => void;
}

const InputMasterCard: React.FC<InputMasterCardProps> = ({ devices, selectedDeviceId, onSelect }) => {
    const totalDevices = devices.length;
    const totalInputs = useMemo(() => {
        return devices.reduce((sum, dev) => sum + (dev.inputs?.length || 0), 0);
    }, [devices]);

    const hasInputs = devices.some(dev => dev.inputs && dev.inputs.length > 0);

    return (
        <GlassCard className="master-card">
            <NestedCard
                title="INPUT SOURCE"
                badge={`${totalDevices} DEVICE${totalDevices !== 1 ? 'S' : ''} • ${totalInputs} INPUT${totalInputs !== 1 ? 'S' : ''}`}
                defaultExpanded={true}
            >
                {!hasInputs ? (
                    <div className="empty-state">
                        <AlertCircle size={24} />
                        <span>No input devices detected</span>
                    </div>
                ) : (
                    <div className="device-list">
                        {devices.map((device) => {
                            const hasSignalInputs = device.inputs?.filter(i => i.signal_detected).length || 0;

                            return (
                                <NestedCard
                                    key={device.device_number}
                                    title={device.name || `Device ${device.device_number}`}
                                    badge={`${hasSignalInputs}/${device.inputs?.length || 0} ACTIVE`}
                                    isSubCard={true}
                                    defaultExpanded={false}
                                >
                                    <div className="input-grid">
                                        {device.inputs?.map((input) => {
                                            // For now, select by device. Later we can extend to input-level selection
                                            const isSelected = selectedDeviceId === device.device_number;
                                            const hasSignal = input.signal_detected;

                                            return (
                                                <div
                                                    key={input.id}
                                                    className={`input-card ${isSelected ? 'selected' : ''} ${hasSignal ? 'has-signal' : 'no-signal'}`}
                                                    onClick={() => onSelect(device.device_number)}
                                                >
                                                    <div className="input-icon">
                                                        {hasSignal ? (
                                                            <Activity size={16} color="#4ade80" />
                                                        ) : (
                                                            <AlertCircle size={16} color="#666" />
                                                        )}
                                                    </div>
                                                    <div className="input-info">
                                                        <span className="input-port">{input.port}</span>
                                                        <span className={`input-status ${hasSignal ? 'live' : 'dead'}`}>
                                                            {hasSignal ? input.format : 'No Signal'}
                                                        </span>
                                                    </div>
                                                    <div className="input-select">
                                                        <Radio size={14} className={isSelected ? 'radio-on' : 'radio-off'} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </NestedCard>
                            );
                        })}
                    </div>
                )}
            </NestedCard>
        </GlassCard>
    );
};

export default InputMasterCard;
