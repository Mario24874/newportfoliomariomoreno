import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FaPlay, FaCheckCircle, FaClock, FaSpinner, FaRobot, FaDatabase, FaEnvelope, FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

type NodeStatus = 'idle' | 'running' | 'done';

interface AutoNodeData {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  status: NodeStatus;
  color: string;
  [key: string]: unknown;
}

const statusColors: Record<NodeStatus, string> = {
  idle: 'border-gray-300 bg-white',
  running: 'border-orange-400 bg-orange-50 shadow-orange-200 shadow-lg',
  done: 'border-green-400 bg-green-50 shadow-green-200 shadow-lg',
};

const AutoNode: React.FC<NodeProps<AutoNodeData>> = ({ data }) => {
  const status = (data.status as NodeStatus) ?? 'idle';
  return (
    <div className={`rounded-xl border-2 px-4 py-3 min-w-[140px] transition-all duration-500 ${statusColors[status]}`}>
      <Handle type="target" position={Position.Left} style={{ background: '#94a3b8' }} />
      <div className="flex flex-col items-center gap-1 text-center">
        <div className={`text-2xl ${status === 'done' ? 'text-green-600' : status === 'running' ? 'text-orange-500' : 'text-gray-500'}`}>
          {status === 'running' ? <FaSpinner className="animate-spin" /> : status === 'done' ? <FaCheckCircle /> : data.icon as React.ReactNode}
        </div>
        <span className="text-xs font-semibold text-gray-700 leading-tight">{data.label as string}</span>
        <span className="text-[10px] text-gray-400">{data.sublabel as string}</span>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#94a3b8' }} />
    </div>
  );
};

const nodeTypes = { auto: AutoNode };

const buildNodes = (labels: { trigger: string; process: string; ai: string; notify: string; done: string }, statuses: Record<string, NodeStatus>): Node[] => [
  {
    id: '1',
    type: 'auto',
    position: { x: 0, y: 60 },
    data: { label: labels.trigger, sublabel: 'Webhook', icon: <FaClock />, status: statuses['1'], color: 'blue' },
  },
  {
    id: '2',
    type: 'auto',
    position: { x: 190, y: 0 },
    data: { label: labels.process, sublabel: 'Transform', icon: <FaDatabase />, status: statuses['2'], color: 'purple' },
  },
  {
    id: '3',
    type: 'auto',
    position: { x: 190, y: 130 },
    data: { label: labels.ai, sublabel: 'GPT-4', icon: <FaRobot />, status: statuses['3'], color: 'orange' },
  },
  {
    id: '4',
    type: 'auto',
    position: { x: 380, y: 60 },
    data: { label: labels.notify, sublabel: 'Email + Slack', icon: <FaEnvelope />, status: statuses['4'], color: 'teal' },
  },
  {
    id: '5',
    type: 'auto',
    position: { x: 570, y: 60 },
    data: { label: labels.done, sublabel: 'Logged', icon: <FaBell />, status: statuses['5'], color: 'green' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: false, style: { stroke: '#94a3b8' } },
  { id: 'e1-3', source: '1', target: '3', animated: false, style: { stroke: '#94a3b8' } },
  { id: 'e2-4', source: '2', target: '4', animated: false, style: { stroke: '#94a3b8' } },
  { id: 'e3-4', source: '3', target: '4', animated: false, style: { stroke: '#94a3b8' } },
  { id: 'e4-5', source: '4', target: '5', animated: false, style: { stroke: '#94a3b8' } },
];

const STEP_DELAY = 700;

const N8nAutomationDemo: React.FC = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const labels = {
    trigger: isEs ? 'Disparador' : 'Trigger',
    process: isEs ? 'Procesar Datos' : 'Process Data',
    ai: isEs ? 'Análisis IA' : 'AI Analysis',
    notify: isEs ? 'Notificar' : 'Notify',
    done: isEs ? 'Completado' : 'Completed',
  };

  const [statuses, setStatuses] = useState<Record<string, NodeStatus>>({
    '1': 'idle', '2': 'idle', '3': 'idle', '4': 'idle', '5': 'idle',
  });
  const [running, setRunning] = useState(false);
  const [success, setSuccess] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(labels, statuses));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const updateStatuses = (newStatuses: Record<string, NodeStatus>) => {
    setStatuses(newStatuses);
    setNodes(buildNodes(labels, newStatuses));
  };

  const animateEdges = (animated: boolean) => {
    setEdges(initialEdges.map((e) => ({ ...e, animated, style: { stroke: animated ? '#f97316' : '#94a3b8', strokeWidth: animated ? 2 : 1 } })));
  };

  const runFlow = async () => {
    if (running) return;
    setRunning(true);
    setSuccess(false);

    const reset: Record<string, NodeStatus> = { '1': 'idle', '2': 'idle', '3': 'idle', '4': 'idle', '5': 'idle' };
    updateStatuses(reset);
    animateEdges(false);

    await delay(200);
    updateStatuses({ ...reset, '1': 'running' });
    await delay(STEP_DELAY);
    updateStatuses({ ...reset, '1': 'done', '2': 'running', '3': 'running' });
    animateEdges(true);
    await delay(STEP_DELAY);
    updateStatuses({ ...reset, '1': 'done', '2': 'done', '3': 'done', '4': 'running' });
    await delay(STEP_DELAY);
    updateStatuses({ ...reset, '1': 'done', '2': 'done', '3': 'done', '4': 'done', '5': 'running' });
    await delay(STEP_DELAY);
    updateStatuses({ '1': 'done', '2': 'done', '3': 'done', '4': 'done', '5': 'done' });
    animateEdges(false);
    setRunning(false);
    setSuccess(true);
  };

  const reset = () => {
    setSuccess(false);
    const idle: Record<string, NodeStatus> = { '1': 'idle', '2': 'idle', '3': 'idle', '4': 'idle', '5': 'idle' };
    updateStatuses(idle);
    animateEdges(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full h-[260px] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnDrag={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
        </ReactFlow>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={runFlow}
          disabled={running}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {running ? <FaSpinner className="animate-spin" /> : <FaPlay />}
          {running
            ? (isEs ? 'Ejecutando...' : 'Running...')
            : (isEs ? 'Ejecutar Flujo' : 'Run Flow')}
        </button>
        {success && (
          <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 underline">
            {isEs ? 'Reiniciar' : 'Reset'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 bg-green-50 border border-green-300 rounded-lg px-4 py-3 text-green-700 font-semibold text-sm"
          >
            <FaCheckCircle className="text-green-500 text-base" />
            {isEs ? 'La automatización se ejecutó correctamente' : 'The automation ran successfully'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default N8nAutomationDemo;
