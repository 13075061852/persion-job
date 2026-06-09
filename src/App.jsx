import { useEffect, useMemo, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Eraser,
  Expand,
  FileText,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  MessageSquareText,
  Shrink,
  Plus,
  Redo2,
  Search,
  Send,
  Settings,
  Star,
  Trash2,
  Underline,
  Undo2,
  Upload,
  UserRound,
} from 'lucide-react';

const STORAGE_KEY = 'personal-workflow-manager-v1';
const LAYOUT_STORAGE_KEY = 'personal-workflow-manager-layout-v1';
const VIEW_STATE_STORAGE_KEY = 'personal-workflow-manager-view-state-v1';
const GLOBAL_FIELD_LABELS_STORAGE_KEY = 'personal-workflow-manager-global-field-labels-v1';
const BACKUP_VERSION = 1;
const CUSTOMER_GRADES = ['A', 'B', 'C', 'D'];
const EDITOR_FONT_SIZES = ['12px', '14px', '16px', '18px', '22px', '28px', '36px'];
const EDITOR_TEXT_COLORS = ['#111111', '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed'];
const EDITOR_BACKGROUND_COLORS = ['#fff7ad', '#fee2e2', '#dbeafe', '#dcfce7', '#f3e8ff', '#ffffff'];
const DEFAULT_EDITOR_TEXT_COLOR = EDITOR_TEXT_COLORS[0];
const DEFAULT_EDITOR_BACKGROUND_COLOR = EDITOR_BACKGROUND_COLORS[5];
const EDITOR_ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const EDITOR_IMAGE_MIN_WIDTH = 80;
const EDITOR_IMAGE_WHEEL_STEP = 32;
const DEFAULT_LEFT_PANEL_WIDTH = 360;
const DEFAULT_RIGHT_PANEL_WIDTH = 540;
const COLLAPSED_PANEL_WIDTH = 48;
const RESIZER_WIDTH = 10;
const MIN_LEFT_PANEL_WIDTH = 260;
const MIN_RIGHT_PANEL_WIDTH = 360;
const MIN_CENTER_PANEL_WIDTH = 360;

const gradeMap = {
  A: '非常优质',
  B: '优质',
  C: '良好',
  D: '一般',
};

const seedCustomers = [
  {
    id: 'c-001',
    serialNumber: '1',
    pinned: true,
    company: '华为',
    grade: 'A',
    country: '中国',
    website: 'www.huawei.com',
    contact: '王军',
    email: 'aaaa@xxx.com',
    phone: 'xxxxxxxxxxxx',
    fax: 'xxxxxxxxxxxx',
    otherContact: '微信 / WhatsApp',
    remark: '重点客户，报价后需要持续跟进',
    backup1: '通信设备',
    backup2: '华南区',
    backup3: '年度询价',
    backup4: '可约视频会议',
    lastFollowDate: '2026-03-01',
    reminderDays: '30',
    messyNotes: '客户上次提到希望把不同产品线拆开报价。电话里对交期比较敏感，后续沟通先确认预算和采购节奏。',
    timeline: [
      { id: 't-1', date: '2026-03-01', content: '邮件跟进，客户暂无反馈', status: '跟进中' },
      { id: 't-2', date: '2026-02-01', content: '电话确认客户是否收到报价，无应答', status: '待确认' },
      { id: 't-3', date: '2026-01-18', content: '客户询价，整理产品目录和价格表', status: '已完成' },
      { id: 't-4', date: '2017-01-03', content: '邮件跟进，客户暂无反馈', status: '已完成' },
    ],
  },
  {
    id: 'c-002',
    serialNumber: '2',
    pinned: false,
    company: '小米',
    grade: 'A',
    country: '中国',
    website: 'www.xiaomi.com',
    contact: '张丽',
    email: 'aaaa@xxx.com',
    phone: 'xxxxxxxxxx',
    fax: 'xxxxxxxxxx',
    otherContact: '企业微信',
    remark: '价格敏感，适合批量方案',
    backup1: '智能硬件',
    backup2: '',
    backup3: '',
    backup4: '',
    lastFollowDate: '2026-02-18',
    reminderDays: '30',
    messyNotes: '先发产品清单，再补一版阶梯报价。',
    timeline: [{ id: 't-5', date: '2026-02-18', content: '发送第一版报价单', status: '跟进中' }],
  },
  {
    id: 'c-003',
    serialNumber: '3',
    pinned: false,
    company: '三星',
    grade: 'B',
    country: '韩国',
    website: 'www.samsung.com',
    contact: '李娜',
    email: 'aaaa@xxx.com',
    phone: 'xxxxxxxxxx',
    fax: 'xxxxxxxxxx',
    otherContact: 'WhatsApp',
    remark: '需要英文资料',
    backup1: '海外客户',
    backup2: '',
    backup3: '',
    backup4: '',
    lastFollowDate: '2026-01-03',
    reminderDays: '100',
    messyNotes: '资料要用英文版，邮件标题需要写明型号。',
    timeline: [{ id: 't-6', date: '2026-01-03', content: '邮件跟进，客户暂未反馈', status: '暂停' }],
  },
];

const archiveFields = [
  ['company', '名字'],
  ['website', '网址'],
  ['country', '国籍'],
  ['phone', '电话'],
  ['otherContact', 'Whatsapp'],
  ['fax', 'Signal'],
  ['backup1', 'Telegram'],
  ['backup2', 'Wechat'],
  ['grade', '等级'],
  ['lastFollowDate', '最后跟进日期'],
];

function readInitialCustomers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initialCustomers = stored ? JSON.parse(stored) : seedCustomers;
    return initialCustomers.map((customer, index) => ({
      ...customer,
      serialNumber: customer.serialNumber ?? String(index + 1),
      grade: CUSTOMER_GRADES.includes(customer.grade) ? customer.grade : 'D',
      timeline: (customer.timeline ?? []).map((item, index) => ({
        ...item,
        title: item.title ?? '沟通记录',
        documentContent: item.documentContent ?? (index === 0 ? customer.messyNotes || item.content : item.content),
      })),
    }));
  } catch {
    return seedCustomers.map((customer, index) => ({
      ...customer,
      serialNumber: customer.serialNumber ?? String(index + 1),
      timeline: (customer.timeline ?? []).map((item, index) => ({
        ...item,
        title: item.title ?? '沟通记录',
        documentContent: item.documentContent ?? (index === 0 ? customer.messyNotes || item.content : item.content),
      })),
    }));
  }
}

function saveCustomers(customers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

function normalizeCustomers(customers) {
  if (!Array.isArray(customers)) return [];
  return customers.map((customer, index) => ({
    ...customer,
    id: typeof customer.id === 'string' && customer.id ? customer.id : `c-import-${Date.now()}-${index}`,
    serialNumber: customer.serialNumber ?? String(index + 1),
    pinned: Boolean(customer.pinned),
    grade: CUSTOMER_GRADES.includes(customer.grade) ? customer.grade : 'D',
    timeline: (customer.timeline ?? []).map((item, itemIndex) => ({
      ...item,
      id: typeof item.id === 'string' && item.id ? item.id : `t-import-${Date.now()}-${index}-${itemIndex}`,
      title: item.title ?? '沟通记录',
      documentContent: item.documentContent ?? (itemIndex === 0 ? customer.messyNotes || item.content : item.content),
    })),
  }));
}

function readInitialLayout() {
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!stored) {
      return {
        leftCollapsed: false,
        rightCollapsed: false,
        leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
        rightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,
      };
    }
    const parsed = JSON.parse(stored);
    return {
      leftCollapsed: Boolean(parsed.leftCollapsed),
      rightCollapsed: Boolean(parsed.rightCollapsed),
      leftPanelWidth: Number(parsed.leftPanelWidth) || DEFAULT_LEFT_PANEL_WIDTH,
      rightPanelWidth: Number(parsed.rightPanelWidth) || DEFAULT_RIGHT_PANEL_WIDTH,
    };
  } catch {
    return {
      leftCollapsed: false,
      rightCollapsed: false,
      leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
      rightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,
    };
  }
}

function saveLayout(layout) {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}

function readInitialViewState() {
  try {
    const stored = localStorage.getItem(VIEW_STATE_STORAGE_KEY);
    if (!stored) {
      return {
        selectedId: '',
        selectedWorkflowId: '',
        selectedWorkflowIds: [],
        workflowViewMode: 'single',
      };
    }
    const parsed = JSON.parse(stored);
    return {
      selectedId: typeof parsed.selectedId === 'string' ? parsed.selectedId : '',
      selectedWorkflowId: typeof parsed.selectedWorkflowId === 'string' ? parsed.selectedWorkflowId : '',
      selectedWorkflowIds: Array.isArray(parsed.selectedWorkflowIds)
        ? parsed.selectedWorkflowIds.filter((item) => typeof item === 'string')
        : [],
      workflowViewMode: parsed.workflowViewMode === 'merged' ? 'merged' : 'single',
    };
  } catch {
    return {
      selectedId: '',
      selectedWorkflowId: '',
      selectedWorkflowIds: [],
      workflowViewMode: 'single',
    };
  }
}

function saveViewState(viewState) {
  localStorage.setItem(VIEW_STATE_STORAGE_KEY, JSON.stringify(viewState));
}

function readInitialGlobalFieldLabels() {
  try {
    const stored = localStorage.getItem(GLOBAL_FIELD_LABELS_STORAGE_KEY);
    if (!stored) return {};
    return normalizeFieldLabels(JSON.parse(stored));
  } catch {
    return {};
  }
}

function saveGlobalFieldLabels(fieldLabels) {
  localStorage.setItem(GLOBAL_FIELD_LABELS_STORAGE_KEY, JSON.stringify(fieldLabels));
}

function makeBackupPayload({ customers, globalFieldLabels, layout, viewState }) {
  return {
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'personal-workflow-manager',
    customers,
    globalFieldLabels,
    layout,
    viewState,
  };
}

function getCustomerIdentityKey(customer) {
  const parts = [customer.company, customer.contact, customer.email]
    .map((value) => String(value ?? '').trim().toLowerCase());
  return parts.some(Boolean) ? parts.join('|') : '';
}

function makeCustomerDuplicateKeys(customers) {
  return customers.reduce((keys, customer) => {
    if (customer.id) keys.ids.add(customer.id);
    const identityKey = getCustomerIdentityKey(customer);
    if (identityKey) keys.identities.add(identityKey);
    return keys;
  }, { ids: new Set(), identities: new Set() });
}

function isDuplicateCustomer(customer, duplicateKeys) {
  const identityKey = getCustomerIdentityKey(customer);
  return duplicateKeys.ids.has(customer.id) || (identityKey && duplicateKeys.identities.has(identityKey));
}

function getImportStats(importedCustomers, currentCustomers) {
  const duplicateKeys = makeCustomerDuplicateKeys(currentCustomers);
  const duplicateCount = importedCustomers.filter((customer) => isDuplicateCustomer(customer, duplicateKeys)).length;
  return {
    totalCount: importedCustomers.length,
    duplicateCount,
    newCount: importedCustomers.length - duplicateCount,
  };
}

function formatFileSize(size = 0) {
  if (!Number.isFinite(size) || size <= 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getAttachmentKind(fileName = '', fileType = '') {
  const lowerName = fileName.toLowerCase();
  const lowerType = fileType.toLowerCase();
  if (lowerType.includes('pdf') || lowerName.endsWith('.pdf')) return 'pdf';
  if (lowerType.includes('word') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) return 'word';
  if (lowerType.includes('excel') || lowerType.includes('spreadsheet') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) return 'excel';
  return 'file';
}

function dataUrlToArrayBuffer(dataUrl = '') {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function looksLikeHtml(value = '') {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function toEditorHtml(value = '') {
  return looksLikeHtml(value) ? value : escapeHtml(value);
}

function getTextLengthFromHtml(value = '') {
  const container = document.createElement('div');
  container.innerHTML = toEditorHtml(value);
  return container.textContent?.length ?? 0;
}

function getPlainTextFromHtml(value = '') {
  const container = document.createElement('div');
  container.innerHTML = toEditorHtml(value);
  return container.textContent ?? '';
}

function trimWorkflowHtmlEdges(value = '') {
  const container = document.createElement('div');
  container.innerHTML = toEditorHtml(value);

  const isEmptyNode = (node) => {
    if (!node) return true;
    if (node.nodeType === Node.TEXT_NODE) {
      return !(node.textContent ?? '').trim();
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return true;

    const element = node;
    const mediaTags = ['IMG', 'VIDEO', 'IFRAME', 'TABLE', 'UL', 'OL', 'BLOCKQUOTE', 'HR'];
    if (mediaTags.includes(element.tagName)) return false;

    const text = (element.textContent ?? '').replace(/\u00a0/g, ' ').trim();
    const hasMedia = element.querySelector('img,video,iframe,table,ul,ol,blockquote,hr');
    if (hasMedia) return false;

    return !text && !element.children.length;
  };

  while (container.firstChild && isEmptyNode(container.firstChild)) {
    container.removeChild(container.firstChild);
  }

  while (container.lastChild && isEmptyNode(container.lastChild)) {
    container.removeChild(container.lastChild);
  }

  return container.innerHTML;
}

function normalizeEditorUrl(value = '') {
  const url = value.trim();
  if (!url) return '';
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return `https://${url}`;
}

function makeArchiveDraft(customer, globalFieldLabels = {}) {
  if (!customer) return null;
  const draft = archiveFields.reduce((nextDraft, [key]) => {
    nextDraft[key] = customer[key] ?? '';
    return nextDraft;
  }, { id: customer.id });
  draft.fieldLabels = archiveFields.reduce((labels, [key, defaultLabel]) => {
    labels[key] = customer?.fieldLabels?.[key] ?? globalFieldLabels?.[key] ?? defaultLabel;
    return labels;
  }, {});
  return draft;
}

function getArchiveFieldLabel(customer, globalFieldLabels, fieldKey, defaultLabel) {
  return customer?.fieldLabels?.[fieldKey] || globalFieldLabels?.[fieldKey] || defaultLabel;
}

function normalizeFieldLabels(fieldLabels = {}, fallbackLabels = {}) {
  return archiveFields.reduce((labels, [key, defaultLabel]) => {
    const label = fieldLabels[key]?.trim();
    const fallbackLabel = fallbackLabels[key] ?? defaultLabel;
    if (label && label !== fallbackLabel) {
      labels[key] = label;
    }
    return labels;
  }, {});
}

function App() {
  const initialLayout = readInitialLayout();
  const initialViewState = readInitialViewState();
  const [customers, setCustomers] = useState(readInitialCustomers);
  const [globalFieldLabels, setGlobalFieldLabels] = useState(readInitialGlobalFieldLabels);
  const [selectedId, setSelectedId] = useState(() => initialViewState.selectedId || customers[0]?.id || '');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(() => initialViewState.selectedWorkflowId || '');
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState(() => initialViewState.selectedWorkflowIds || []);
  const [workflowViewMode, setWorkflowViewMode] = useState(() => initialViewState.workflowViewMode || 'single');
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('全部');
  const [noteTitleDraft, setNoteTitleDraft] = useState('');
  const [editingWorkflowTitleId, setEditingWorkflowTitleId] = useState('');
  const [archiveEditing, setArchiveEditing] = useState(false);
  const [archiveDraft, setArchiveDraft] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(initialLayout.leftCollapsed);
  const [rightCollapsed, setRightCollapsed] = useState(initialLayout.rightCollapsed);
  const [leftPanelWidth, setLeftPanelWidth] = useState(initialLayout.leftPanelWidth);
  const [rightPanelWidth, setRightPanelWidth] = useState(initialLayout.rightPanelWidth);
  const [activeResizer, setActiveResizer] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [activeEditorTextColor, setActiveEditorTextColor] = useState(DEFAULT_EDITOR_TEXT_COLOR);
  const [activeEditorBackgroundColor, setActiveEditorBackgroundColor] = useState(DEFAULT_EDITOR_BACKGROUND_COLOR);
  const boardRef = useRef(null);
  const editorRef = useRef(null);
  const editorSelectionRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const backupInputRef = useRef(null);
  const imageDragStateRef = useRef(null);
  const imageDragGhostRef = useRef(null);
  const imageDropMarkerRef = useRef(null);
  const dragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const selectedCustomer = customers.find((customer) => customer.id === selectedId) ?? customers[0];
  const archiveCustomer = archiveEditing && archiveDraft?.id === selectedCustomer?.id
    ? archiveDraft
    : selectedCustomer;
  const selectedCustomerTimeline = selectedCustomer?.timeline ?? [];
  const focusedWorkflow = selectedCustomer?.timeline?.find((item) => item.id === selectedWorkflowId) ?? null;
  const selectedWorkflow = focusedWorkflow
    ?? selectedCustomerTimeline[0]
    ?? null;
  const mergedWorkflows = selectedCustomerTimeline.filter((item) => selectedWorkflowIds.includes(item.id));
  const isMergedWorkflowView = workflowViewMode === 'merged';
  const activeWorkflowForActions = isMergedWorkflowView
    ? (focusedWorkflow && selectedWorkflowIds.includes(focusedWorkflow.id) ? focusedWorkflow : null)
    : selectedWorkflow;
  const editorContent = isMergedWorkflowView
    ? mergedWorkflows.map((item) => {
      const content = trimWorkflowHtmlEdges(item.documentContent ?? item.content ?? '');
      return [
        `<section class="mergedWorkflowSection" data-workflow-id="${item.id}">`,
        `<div class="mergedWorkflowMeta" contenteditable="false">`,
        `<span>${escapeHtml(item.date ?? '')}</span>`,
        `<span>${escapeHtml(item.title ?? item.content ?? '沟通记录')}</span>`,
        `<span class="statusTag status${item.status}">${escapeHtml(item.status ?? '')}</span>`,
        `</div>`,
        `<div class="mergedWorkflowBody" contenteditable="true">${toEditorHtml(content)}</div>`,
        `</section>`,
      ].join('');
    }).join('')
    : selectedWorkflow
      ? selectedWorkflow.documentContent ?? selectedWorkflow.content ?? ''
      : selectedCustomer?.messyNotes ?? '';
  const editorKey = isMergedWorkflowView
    ? `merged:${selectedCustomer?.id ?? 'empty'}:${selectedWorkflowIds.join(',')}`
    : selectedWorkflow
      ? selectedWorkflow.id
      : selectedCustomer?.id ?? 'empty-editor';
  const canEditEditor = Boolean(selectedCustomer) && (!isMergedWorkflowView || mergedWorkflows.length > 0);
  const editorWordCount = useMemo(() => getTextLengthFromHtml(editorContent), [editorContent]);
  const selectedCustomerTitle = selectedCustomer
    ? [selectedCustomer.company || '未命名用户', selectedCustomer.contact, selectedCustomer.country].filter(Boolean).join(' · ')
    : '未命名用户';

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        const haystack = `${customer.company} ${customer.contact} ${customer.country} ${customer.email}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase()) && (gradeFilter === '全部' || customer.grade === gradeFilter);
      });
  }, [customers, gradeFilter, query]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      active: customers.filter((customer) => customer.timeline?.[0]?.status !== '暂停').length,
    };
  }, [customers]);

  const editorExpanded = leftCollapsed && rightCollapsed;
  const boardStyle = useMemo(() => ({
    gridTemplateColumns: `${leftCollapsed ? COLLAPSED_PANEL_WIDTH : leftPanelWidth}px ${RESIZER_WIDTH}px minmax(0, 1fr) ${RESIZER_WIDTH}px ${rightCollapsed ? COLLAPSED_PANEL_WIDTH : rightPanelWidth}px`,
  }), [leftCollapsed, rightCollapsed, leftPanelWidth, rightPanelWidth]);

  useEffect(() => {
    if (!editorRef.current || isMergedWorkflowView) return;
    editorRef.current.innerHTML = toEditorHtml(editorContent);
    prepareEditorImages();
    prepareEditorAttachments();
    editorSelectionRef.current = null;
  }, [editorKey, isMergedWorkflowView]);

  useEffect(() => {
    if (!editorRef.current || !isMergedWorkflowView) return;
    editorRef.current.innerHTML = toEditorHtml(editorContent);
    prepareEditorImages();
    prepareEditorAttachments();
    editorSelectionRef.current = null;
  }, [editorKey, isMergedWorkflowView]);

  useEffect(() => () => {
    removeCustomImageDragListeners();
    removeImageDragGhost();
    removeImageDropMarker();
    imageDragStateRef.current = null;
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
  }, []);

  useEffect(() => {
    setArchiveEditing(false);
    setArchiveDraft(null);
  }, [selectedCustomer?.id]);

  useEffect(() => {
    saveLayout({ leftCollapsed, rightCollapsed, leftPanelWidth, rightPanelWidth });
  }, [leftCollapsed, rightCollapsed, leftPanelWidth, rightPanelWidth]);

  useEffect(() => {
    saveViewState({ selectedId, selectedWorkflowId, selectedWorkflowIds, workflowViewMode });
  }, [selectedId, selectedWorkflowId, selectedWorkflowIds, workflowViewMode]);

  useEffect(() => {
    if (customers.length === 0) {
      if (selectedId) setSelectedId('');
      if (selectedWorkflowId) setSelectedWorkflowId('');
      if (selectedWorkflowIds.length > 0) setSelectedWorkflowIds([]);
      return;
    }

    const hasSelectedCustomer = customers.some((customer) => customer.id === selectedId);
    if (!hasSelectedCustomer) {
      setSelectedId(customers[0]?.id ?? '');
      setSelectedWorkflowId('');
      setSelectedWorkflowIds([]);
      return;
    }

    const workflows = customers.find((customer) => customer.id === selectedId)?.timeline ?? [];
    if (selectedWorkflowIds.length > 0) {
      const nextSelectedWorkflowIds = selectedWorkflowIds.filter((item) => workflows.some((workflow) => workflow.id === item));
      if (nextSelectedWorkflowIds.length !== selectedWorkflowIds.length) {
        setSelectedWorkflowIds(nextSelectedWorkflowIds);
      }
    }

    if (!selectedWorkflowId) return;

    const hasSelectedWorkflow = workflows.some((item) => item.id === selectedWorkflowId);
    if (!hasSelectedWorkflow) {
      setSelectedWorkflowId('');
    }
  }, [customers, selectedId, selectedWorkflowId, selectedWorkflowIds]);

  useEffect(() => {
    if (!activeResizer) return undefined;

    const handlePointerMove = (event) => {
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (!boardRect) return;

      const fixedRightWidth = rightCollapsed ? COLLAPSED_PANEL_WIDTH : rightPanelWidth;
      const fixedLeftWidth = leftCollapsed ? COLLAPSED_PANEL_WIDTH : leftPanelWidth;
      const maxLeftWidth = Math.max(
        MIN_LEFT_PANEL_WIDTH,
        boardRect.width - (RESIZER_WIDTH * 2) - fixedRightWidth - MIN_CENTER_PANEL_WIDTH,
      );
      const maxRightWidth = Math.max(
        MIN_RIGHT_PANEL_WIDTH,
        boardRect.width - (RESIZER_WIDTH * 2) - fixedLeftWidth - MIN_CENTER_PANEL_WIDTH,
      );

      if (activeResizer === 'left' && !leftCollapsed) {
        const nextWidth = Math.min(Math.max(event.clientX - boardRect.left, MIN_LEFT_PANEL_WIDTH), maxLeftWidth);
        setLeftPanelWidth(Math.round(nextWidth));
      }

      if (activeResizer === 'right' && !rightCollapsed) {
        const nextWidth = Math.min(Math.max(boardRect.right - event.clientX, MIN_RIGHT_PANEL_WIDTH), maxRightWidth);
        setRightPanelWidth(Math.round(nextWidth));
      }
    };

    const stopResizing = () => {
      setActiveResizer('');
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };
  }, [activeResizer, leftCollapsed, leftPanelWidth, rightCollapsed, rightPanelWidth]);

  function commitCustomers(nextCustomers) {
    setCustomers(nextCustomers);
    saveCustomers(nextCustomers);
  }

  function commitGlobalFieldLabels(nextFieldLabels) {
    setGlobalFieldLabels(nextFieldLabels);
    saveGlobalFieldLabels(nextFieldLabels);
  }

  function getCustomersWithCurrentEditorContent(sourceCustomers = customers) {
    if (!editorRef.current || !selectedCustomer) return sourceCustomers;

    if (isMergedWorkflowView) {
      const sections = Array.from(editorRef.current.querySelectorAll('.mergedWorkflowSection'));
      if (sections.length === 0) return sourceCustomers;

      const contentByWorkflowId = sections.reduce((contentMap, section) => {
        const workflowId = section.getAttribute('data-workflow-id');
        const body = section.querySelector('.mergedWorkflowBody');
        if (workflowId && body) {
          contentMap.set(workflowId, body.innerHTML);
        }
        return contentMap;
      }, new Map());

      if (contentByWorkflowId.size === 0) return sourceCustomers;

      return sourceCustomers.map((customer) => {
        if (customer.id !== selectedCustomer.id) return customer;
        const timeline = (customer.timeline ?? []).map((entry) => (
          contentByWorkflowId.has(entry.id)
            ? { ...entry, documentContent: contentByWorkflowId.get(entry.id) }
            : entry
        ));
        return { ...customer, timeline };
      });
    }

    const contentHtml = getEditorHtmlForSave();
    return sourceCustomers.map((customer) => {
      if (customer.id !== selectedCustomer.id) return customer;
      if (!selectedWorkflow) return { ...customer, messyNotes: contentHtml };

      const timeline = (customer.timeline ?? []).map((entry) => (
        entry.id === selectedWorkflow.id
          ? { ...entry, documentContent: contentHtml }
          : entry
      ));
      return { ...customer, timeline };
    });
  }

  function saveCurrentEditorContent() {
    const nextCustomers = getCustomersWithCurrentEditorContent();
    commitCustomers(nextCustomers);
    return nextCustomers;
  }

  function exportBackupData() {
    const backupCustomers = getCustomersWithCurrentEditorContent();
    const layout = { leftCollapsed, rightCollapsed, leftPanelWidth, rightPanelWidth };
    const viewState = { selectedId, selectedWorkflowId, selectedWorkflowIds, workflowViewMode };
    const payload = makeBackupPayload({ customers: backupCustomers, globalFieldLabels, layout, viewState });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function applyImportedBackup(payload, mode = 'overwrite', preparedCustomers = null) {
    const importedCustomers = preparedCustomers ?? normalizeCustomers(Array.isArray(payload) ? payload : payload?.customers);
    if (importedCustomers.length === 0) {
      throw new Error('备份文件里没有可导入的客户数据');
    }

    const importedFieldLabels = normalizeFieldLabels(payload?.globalFieldLabels ?? {});
    if (mode === 'append') {
      const baseCustomers = getCustomersWithCurrentEditorContent();
      const duplicateKeys = makeCustomerDuplicateKeys(baseCustomers);
      const newCustomers = importedCustomers.filter((customer) => !isDuplicateCustomer(customer, duplicateKeys));
      const nextCustomers = [...baseCustomers, ...newCustomers];

      commitCustomers(nextCustomers);
      commitGlobalFieldLabels({ ...importedFieldLabels, ...globalFieldLabels });
      setSelectedId(selectedId || nextCustomers[0]?.id || '');
      setArchiveEditing(false);
      setArchiveDraft(null);
      setEditingWorkflowTitleId('');
      setPendingImport(null);
      return;
    }

    const importedLayout = payload?.layout && typeof payload.layout === 'object'
      ? {
        leftCollapsed: Boolean(payload.layout.leftCollapsed),
        rightCollapsed: Boolean(payload.layout.rightCollapsed),
        leftPanelWidth: Number(payload.layout.leftPanelWidth) || DEFAULT_LEFT_PANEL_WIDTH,
        rightPanelWidth: Number(payload.layout.rightPanelWidth) || DEFAULT_RIGHT_PANEL_WIDTH,
      }
      : { leftCollapsed, rightCollapsed, leftPanelWidth, rightPanelWidth };
    const importedViewState = payload?.viewState && typeof payload.viewState === 'object'
      ? {
        selectedId: typeof payload.viewState.selectedId === 'string' ? payload.viewState.selectedId : '',
        selectedWorkflowId: typeof payload.viewState.selectedWorkflowId === 'string' ? payload.viewState.selectedWorkflowId : '',
        selectedWorkflowIds: Array.isArray(payload.viewState.selectedWorkflowIds)
          ? payload.viewState.selectedWorkflowIds.filter((item) => typeof item === 'string')
          : [],
        workflowViewMode: payload.viewState.workflowViewMode === 'merged' ? 'merged' : 'single',
      }
      : { selectedId: importedCustomers[0]?.id ?? '', selectedWorkflowId: '', selectedWorkflowIds: [], workflowViewMode: 'single' };
    const validSelectedId = importedCustomers.some((customer) => customer.id === importedViewState.selectedId)
      ? importedViewState.selectedId
      : importedCustomers[0]?.id ?? '';

    commitCustomers(importedCustomers);
    commitGlobalFieldLabels(importedFieldLabels);
    setLeftCollapsed(importedLayout.leftCollapsed);
    setRightCollapsed(importedLayout.rightCollapsed);
    setLeftPanelWidth(importedLayout.leftPanelWidth);
    setRightPanelWidth(importedLayout.rightPanelWidth);
    saveLayout(importedLayout);
    setSelectedId(validSelectedId);
    setSelectedWorkflowId(importedViewState.selectedWorkflowId);
    setSelectedWorkflowIds(importedViewState.selectedWorkflowIds);
    setWorkflowViewMode(importedViewState.workflowViewMode);
    saveViewState({ ...importedViewState, selectedId: validSelectedId });
    setArchiveEditing(false);
    setArchiveDraft(null);
    setEditingWorkflowTitleId('');
    setPendingImport(null);
  }

  function importBackupData(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result ?? ''));
        const importedCustomers = normalizeCustomers(Array.isArray(payload) ? payload : payload?.customers);
        if (importedCustomers.length === 0) {
          throw new Error('备份文件里没有可导入的客户数据');
        }
        const currentCustomers = getCustomersWithCurrentEditorContent();
        setPendingImport({
          payload,
          importedCustomers,
          stats: getImportStats(importedCustomers, currentCustomers),
        });
      } catch (error) {
        window.alert(error instanceof Error ? error.message : '导入失败，请检查备份文件');
      }
    };
    reader.onerror = () => window.alert('读取备份文件失败');
    reader.readAsText(file, 'UTF-8');
  }

  function updateCustomer(id, patch) {
    commitCustomers(customers.map((customer) => (customer.id === id ? { ...customer, ...patch } : customer)));
  }

  function selectCustomer(id) {
    saveCurrentEditorContent();
    setSelectedId(id);
    setSelectedWorkflowId('');
    setSelectedWorkflowIds([]);
    setEditingWorkflowTitleId('');
  }

  function changeWorkflowViewMode(mode) {
    if (mode === workflowViewMode) return;
    saveCurrentEditorContent();
    if (mode === 'merged') {
      const nextSelectedIds = selectedWorkflowId
        ? [selectedWorkflowId]
        : selectedCustomer?.timeline?.[0]?.id
          ? [selectedCustomer.timeline[0].id]
          : [];
      setSelectedWorkflowIds(nextSelectedIds);
    } else if (!selectedWorkflowId && selectedWorkflowIds[0]) {
      setSelectedWorkflowId(selectedWorkflowIds[0]);
    }
    setWorkflowViewMode(mode);
    setEditingWorkflowTitleId('');
  }

  function selectSingleWorkflow(workflowId) {
    saveCurrentEditorContent();
    setSelectedWorkflowId(workflowId);
  }

  function focusWorkflow(workflowId) {
    saveCurrentEditorContent();
    setSelectedWorkflowId(workflowId);
  }

  function toggleMergedWorkflow(workflowId) {
    saveCurrentEditorContent();
    setSelectedWorkflowId(workflowId);
    setSelectedWorkflowIds((current) => {
      if (current.includes(workflowId)) {
        const next = current.filter((item) => item !== workflowId);
        return next;
      }
      return [...current, workflowId];
    });
  }

  function updateWorkflow(workflowId, patch) {
    if (!selectedCustomer) return;
    const timeline = (selectedCustomer.timeline ?? []).map((entry) =>
      entry.id === workflowId ? { ...entry, ...patch } : entry
    );
    updateCustomer(selectedCustomer.id, { timeline });
  }

  function reorderCustomers(activeId, overId) {
    if (!overId || activeId === overId) return;

    const visibleIds = filteredCustomers.map((customer) => customer.id);
    const oldIndex = visibleIds.indexOf(activeId);
    const newIndex = visibleIds.indexOf(overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const visibleIdSet = new Set(visibleIds);
    const visibleCustomers = customers.filter((customer) => visibleIdSet.has(customer.id));
    const reorderedVisibleCustomers = arrayMove(visibleCustomers, oldIndex, newIndex);
    let visibleCursor = 0;

    commitCustomers(customers.map((customer) => (
      visibleIdSet.has(customer.id)
        ? reorderedVisibleCustomers[visibleCursor++]
        : customer
    )));
  }

  function handleCustomerDragEnd(event) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : '';

    reorderCustomers(activeId, overId);
  }

  function addCustomer() {
    const id = `c-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const nextCustomer = {
      id,
      serialNumber: String(customers.length + 1),
      pinned: false,
      company: '新客户',
      grade: 'C',
      country: '',
      website: '',
      contact: '',
      email: '',
      phone: '',
      fax: '',
      otherContact: '',
      remark: '',
      backup1: '',
      backup2: '',
      backup3: '',
      backup4: '',
      lastFollowDate: today,
      reminderDays: '30',
      messyNotes: '',
      timeline: [],
    };
    commitCustomers([nextCustomer, ...customers]);
    setSelectedId(id);
    setSelectedWorkflowId('');
    setArchiveEditing(false);
    setArchiveDraft(null);
  }

  function updateArchiveDraft(fieldKey, value) {
    setArchiveDraft((draft) => ({
      ...(draft ?? makeArchiveDraft(selectedCustomer, globalFieldLabels)),
      [fieldKey]: value,
    }));
  }

  function updateArchiveFieldLabel(fieldKey, value) {
    setArchiveDraft((draft) => {
      const nextDraft = draft ?? makeArchiveDraft(selectedCustomer, globalFieldLabels);
      return {
        ...nextDraft,
        fieldLabels: {
          ...(nextDraft?.fieldLabels ?? {}),
          [fieldKey]: value,
        },
      };
    });
  }

  function toggleArchiveEditing() {
    if (!selectedCustomer) return;

    if (!archiveEditing) {
      setArchiveDraft(makeArchiveDraft(selectedCustomer, globalFieldLabels));
      setArchiveEditing(true);
      return;
    }

    if (archiveDraft?.id === selectedCustomer.id) {
      const { id, fieldLabels, ...patch } = archiveDraft;
      patch.fieldLabels = normalizeFieldLabels(fieldLabels, globalFieldLabels);
      updateCustomer(id, patch);
    }
    setArchiveEditing(false);
    setArchiveDraft(null);
  }

  function saveArchiveAsGlobalFields() {
    if (!selectedCustomer || archiveDraft?.id !== selectedCustomer.id) return;

    const nextGlobalFieldLabels = normalizeFieldLabels(archiveDraft.fieldLabels);
    commitGlobalFieldLabels(nextGlobalFieldLabels);
    setArchiveEditing(false);
    setArchiveDraft(null);
  }

  function requestDeleteCustomer(customer) {
    if (!customer) return;
    setPendingDelete({
      type: 'customer',
      id: customer.id,
      title: '删除客户档案',
      message: `确定删除「${customer.company || '未命名客户'}」吗？删除后无法恢复。`,
    });
  }

  function performDeleteCustomer(customerId) {
    const nextCustomers = customers.filter((customer) => customer.id !== customerId);
    commitCustomers(nextCustomers);
    if (selectedId === customerId) {
      const nextVisibleCustomer = filteredCustomers.find((customer) => customer.id !== customerId) ?? nextCustomers[0];
      setSelectedId(nextVisibleCustomer?.id ?? '');
      setSelectedWorkflowId('');
      setArchiveEditing(false);
      setArchiveDraft(null);
    }
  }

  function toggleLeftCollapsed() {
    setLeftCollapsed((value) => !value);
  }

  function toggleRightCollapsed() {
    setRightCollapsed((value) => !value);
  }

  function toggleEditorExpanded() {
    const nextExpanded = !editorExpanded;
    setLeftCollapsed(nextExpanded);
    setRightCollapsed(nextExpanded);
  }

  function startResize(side) {
    if ((side === 'left' && leftCollapsed) || (side === 'right' && rightCollapsed)) return;
    setActiveResizer(side);
  }

  function addMessyNote() {
    if (!selectedCustomer) return;
    const contentHtml = getEditorHtmlForSave().trim();
    const contentText = getPlainTextFromHtml(contentHtml).trim();
    if (!contentText && !contentHtml.includes('<img')) return;

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const stamp = now.toLocaleString('zh-CN', { hour12: false });
    const title = noteTitleDraft.trim() || '沟通记录';
    const content = contentText || '[图片内容]';
    const item = {
      id: `t-${Date.now()}`,
      date,
      title,
      content,
      documentContent: contentHtml,
      status: '跟进中',
    };
    const nextNote = `${selectedCustomer.messyNotes ? `${selectedCustomer.messyNotes}\n\n` : ''}[${stamp}] ${title}\n${content}`;
    updateCustomer(selectedCustomer.id, {
      lastFollowDate: date,
      messyNotes: nextNote,
      timeline: [item, ...(selectedCustomer.timeline ?? [])],
    });
    setSelectedWorkflowId(item.id);
    if (workflowViewMode === 'merged') {
      setSelectedWorkflowIds((current) => [item.id, ...current.filter((entryId) => entryId !== item.id)]);
    }
    setEditingWorkflowTitleId('');
    setNoteTitleDraft('');
  }

  function updateEditorContent(value) {
    if (!selectedCustomer) return;
    if (isMergedWorkflowView) {
      updateMergedWorkflowContent();
      return;
    }
    if (!selectedWorkflow) {
      updateCustomer(selectedCustomer.id, { messyNotes: value });
      return;
    }

    updateWorkflow(selectedWorkflow.id, { documentContent: value });
  }

  function updateMergedWorkflowContent() {
    if (!selectedCustomer || !editorRef.current) return;

    const sections = Array.from(editorRef.current.querySelectorAll('.mergedWorkflowSection'));
    if (sections.length === 0) return;

    const contentByWorkflowId = sections.reduce((contentMap, section) => {
      const workflowId = section.getAttribute('data-workflow-id');
      const body = section.querySelector('.mergedWorkflowBody');
      if (workflowId && body) {
        contentMap.set(workflowId, body.innerHTML);
      }
      return contentMap;
    }, new Map());

    if (contentByWorkflowId.size === 0) return;

    const timeline = (selectedCustomer.timeline ?? []).map((entry) => (
      contentByWorkflowId.has(entry.id)
        ? { ...entry, documentContent: contentByWorkflowId.get(entry.id) }
        : entry
    ));
    updateCustomer(selectedCustomer.id, { timeline });
  }

  function getEditorHtmlForSave() {
    if (!editorRef.current) return '';
    const clonedEditor = editorRef.current.cloneNode(true);
    clonedEditor.querySelectorAll('.editorImageFrame.active').forEach((element) => {
      element.classList.remove('active');
    });
    clonedEditor.querySelectorAll('.editorAttachmentFrame.active').forEach((element) => {
      element.classList.remove('active');
    });
    return clonedEditor.innerHTML;
  }

  function syncEditorContent() {
    if (!editorRef.current) return;
    updateEditorContent(getEditorHtmlForSave());
  }

  function saveEditorSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    const editor = editorRef.current;
    if (editor.contains(range.commonAncestorContainer)) {
      editorSelectionRef.current = range.cloneRange();
    }
  }

  function restoreEditorSelection() {
    const selection = window.getSelection();
    const range = editorSelectionRef.current;
    if (!selection || !range || !editorRef.current) return false;
    editorRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  function ensureEditorInsertionRange() {
    if (!editorRef.current) return null;

    restoreEditorSelection();
    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        return range;
      }
    }

    editorRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    editorSelectionRef.current = range.cloneRange();
    return range;
  }

  function applyEditorCommand(command, value = null) {
    restoreEditorSelection();
    document.execCommand(command, false, value);
    syncEditorContent();
    saveEditorSelection();
  }

  function clearEditorFormatting() {
    if (!restoreEditorSelection()) return;
    document.execCommand('removeFormat', false, null);
    document.execCommand('unlink', false, null);

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    const plainText = fragment.textContent ?? '';
    if (!plainText) {
      syncEditorContent();
      saveEditorSelection();
      return;
    }

    range.deleteContents();
    const textNode = document.createTextNode(plainText);
    range.insertNode(textNode);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(textNode);
    selection.addRange(nextRange);
    syncEditorContent();
    saveEditorSelection();
  }

  function clearActiveEditorImage() {
    editorRef.current?.querySelectorAll('.editorImageFrame.active').forEach((element) => {
      element.classList.remove('active');
    });
  }

  function clearActiveEditorAttachment() {
    editorRef.current?.querySelectorAll('.editorAttachmentFrame.active').forEach((element) => {
      element.classList.remove('active');
    });
  }

  function clearActiveEditorObjects() {
    clearActiveEditorImage();
    clearActiveEditorAttachment();
  }

  function makeImageNonDraggable(image) {
    image.draggable = false;
    image.setAttribute('draggable', 'false');
  }

  function prepareImageFrame(frame) {
    frame.contentEditable = 'false';
    frame.draggable = false;
    frame.setAttribute('draggable', 'false');
  }

  function prepareAttachmentFrame(frame) {
    frame.contentEditable = 'false';
    frame.draggable = false;
    frame.setAttribute('draggable', 'false');
    const kind = getAttachmentKind(frame.dataset.attachmentName ?? '', frame.dataset.attachmentType ?? '');
    frame.classList.remove('attachmentPdf', 'attachmentWord', 'attachmentExcel', 'attachmentFile');
    frame.classList.add(`attachment${kind.charAt(0).toUpperCase()}${kind.slice(1)}`);
  }

  function prepareEditorImages() {
    if (!editorRef.current) return;
    editorRef.current.querySelectorAll('img').forEach((image) => {
      makeImageNonDraggable(image);
      const existingFrame = image.closest('.editorImageFrame');
      if (existingFrame) {
        prepareImageFrame(existingFrame);
        return;
      }

      const frame = document.createElement('span');
      frame.className = 'editorImageFrame';
      prepareImageFrame(frame);
      frame.style.width = image.style.width || '320px';

      const handle = document.createElement('span');
      handle.className = 'editorImageResizeHandle';

      image.parentNode?.insertBefore(frame, image);
      frame.appendChild(image);
      frame.appendChild(handle);
    });
  }

  function prepareEditorAttachments() {
    if (!editorRef.current) return;
    editorRef.current.querySelectorAll('.editorAttachmentFrame').forEach((frame) => {
      prepareAttachmentFrame(frame);
    });
  }

  function clearNestedEditorStyles(container, styleKeys) {
    container.querySelectorAll('[style]').forEach((element) => {
      styleKeys.forEach((key) => {
        element.style[key] = '';
      });
      if (!element.getAttribute('style')?.trim()) {
        element.removeAttribute('style');
      }
    });
  }

  function applyStyleToNestedEditorElements(container, style) {
    container.querySelectorAll('span, font, b, strong, i, em, u, a').forEach((element) => {
      Object.assign(element.style, style);
    });
  }

  function applyEditorStyle(style) {
    if (!restoreEditorSelection()) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      document.execCommand('styleWithCSS', false, true);
      if (style.color) {
        document.execCommand('foreColor', false, style.color);
      }
      if (style.backgroundColor) {
        document.execCommand('hiliteColor', false, style.backgroundColor);
      }
      saveEditorSelection();
      return;
    }
    const styledSpan = document.createElement('span');
    Object.assign(styledSpan.style, style);
    styledSpan.appendChild(range.extractContents());
    clearNestedEditorStyles(styledSpan, Object.keys(style));
    applyStyleToNestedEditorElements(styledSpan, style);
    range.insertNode(styledSpan);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(styledSpan);
    selection.addRange(nextRange);
    saveEditorSelection();
    syncEditorContent();
  }

  function applyEditorTextColor(color) {
    setActiveEditorTextColor(color);
    applyEditorStyle({ color });
  }

  function applyEditorBackgroundColor(backgroundColor) {
    setActiveEditorBackgroundColor(backgroundColor);
    applyEditorStyle({ backgroundColor });
  }

  function getClosestStyledItalic(node) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    const match = element?.closest?.('.editorItalic, i, em, span');
    if (!match || !editorRef.current?.contains(match)) return null;
    const style = match instanceof HTMLElement ? match.style : null;
    const hasInlineItalic = style?.fontStyle === 'italic' && style?.transform.includes('skewX');
    return match.classList.contains('editorItalic') || match.tagName === 'I' || match.tagName === 'EM' || hasInlineItalic
      ? match
      : null;
  }

  function unwrapElement(element) {
    const parent = element.parentNode;
    if (!parent) return null;
    const firstChild = element.firstChild;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
    return firstChild ?? parent;
  }

  function toggleEditorItalic() {
    if (!restoreEditorSelection()) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const italicElement = getClosestStyledItalic(range.commonAncestorContainer)
      ?? getClosestStyledItalic(range.startContainer);

    if (italicElement) {
      const selectionTarget = unwrapElement(italicElement);
      selection.removeAllRanges();
      if (selectionTarget) {
        const nextRange = document.createRange();
        nextRange.selectNodeContents(selectionTarget);
        selection.addRange(nextRange);
      }
      syncEditorContent();
      saveEditorSelection();
      return;
    }

    const italicSpan = document.createElement('span');
    italicSpan.className = 'editorItalic';
    italicSpan.appendChild(range.extractContents());
    range.insertNode(italicSpan);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(italicSpan);
    selection.addRange(nextRange);
    syncEditorContent();
    saveEditorSelection();
  }

  function addEditorLink() {
    const url = window.prompt('请输入链接地址');
    if (url) applyEditorCommand('createLink', normalizeEditorUrl(url));
  }

  function addEditorImage() {
    imageInputRef.current?.click();
  }

  function addEditorAttachment() {
    attachmentInputRef.current?.click();
  }

  function createAttachmentFrame({ name, type, size, url }) {
    const kind = getAttachmentKind(name, type);
    const frame = document.createElement('span');
    frame.className = `editorAttachmentFrame attachment${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
    frame.dataset.attachmentName = name;
    frame.dataset.attachmentType = type;
    frame.dataset.attachmentSize = String(size);
    frame.dataset.attachmentUrl = url;
    prepareAttachmentFrame(frame);

    const label = kind === 'pdf' ? 'PDF' : kind === 'word' ? 'Word' : kind === 'excel' ? 'Excel' : '文件';
    frame.innerHTML = [
      `<span class="editorAttachmentIcon">${escapeHtml(label)}</span>`,
      '<span class="editorAttachmentText">',
      `<strong>${escapeHtml(name)}</strong>`,
      `<small>${escapeHtml(formatFileSize(size))}</small>`,
      '</span>',
    ].join('');
    return frame;
  }

  function insertEditorAttachment(file, url) {
    if (!editorRef.current) return;
    const range = ensureEditorInsertionRange();
    if (!range) return;
    const selection = window.getSelection();

    const frame = createAttachmentFrame({
      name: file.name,
      type: file.type,
      size: file.size,
      url,
    });

    range.deleteContents();
    range.insertNode(frame);
    range.setStartAfter(frame);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    clearActiveEditorObjects();
    frame.classList.add('active');
    syncEditorContent();
    saveEditorSelection();
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('读取附件失败'));
      reader.readAsDataURL(file);
    });
  }

  async function handleEditorAttachmentSelected(event) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    for (const file of files) {
      const url = await readFileAsDataUrl(file);
      if (url) insertEditorAttachment(file, url);
    }
  }

  async function openEditorAttachmentPreview(frame) {
    const name = frame.dataset.attachmentName ?? '附件';
    const type = frame.dataset.attachmentType ?? '';
    const size = Number(frame.dataset.attachmentSize ?? 0);
    const url = frame.dataset.attachmentUrl ?? '';
    const kind = getAttachmentKind(name, type);
    setAttachmentPreview({ name, type, size, url, kind, status: 'loading' });

    try {
      if (kind === 'pdf') {
        setAttachmentPreview({ name, type, size, url, kind, status: 'ready' });
        return;
      }

      const arrayBuffer = dataUrlToArrayBuffer(url);
      if (kind === 'word' && name.toLowerCase().endsWith('.docx')) {
        const mammoth = await import('mammoth/mammoth.browser');
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setAttachmentPreview({ name, type, size, url, kind, status: 'ready', html: result.value || '<p>没有可预览内容</p>' });
        return;
      }

      setAttachmentPreview({ name, type, size, url, kind, status: 'unsupported' });
    } catch (error) {
      setAttachmentPreview({ name, type, size, url, kind, status: 'error', message: error instanceof Error ? error.message : '预览失败' });
    }
  }

  function getActiveEditorImageFrame() {
    const frame = editorRef.current?.querySelector('.editorImageFrame.active');
    return frame instanceof HTMLElement ? frame : null;
  }

  function getMaxEditorImageWidth() {
    return Math.max(EDITOR_IMAGE_MIN_WIDTH, (editorRef.current?.clientWidth ?? 0) - 26);
  }

  function setEditorImageWidth(frame, width) {
    const nextWidth = Math.max(EDITOR_IMAGE_MIN_WIDTH, Math.min(getMaxEditorImageWidth(), width));
    frame.style.width = `${Math.round(nextWidth)}px`;
  }

  function alignEditorImage(alignment) {
    const frame = getActiveEditorImageFrame();
    if (!frame) return;

    frame.style.display = 'block';
    frame.style.marginLeft = alignment === 'right' || alignment === 'center' ? 'auto' : '0';
    frame.style.marginRight = alignment === 'left' || alignment === 'center' ? 'auto' : '0';
    syncEditorContent();
  }

  function insertEditorImage(src) {
    if (!editorRef.current) return;
    const range = ensureEditorInsertionRange();
    if (!range) return;
    const selection = window.getSelection();

    const frame = document.createElement('span');
    frame.className = 'editorImageFrame';
    prepareImageFrame(frame);
    frame.style.width = '320px';

    const image = document.createElement('img');
    image.src = src;
    image.alt = '上传图片';
    makeImageNonDraggable(image);

    const handle = document.createElement('span');
    handle.className = 'editorImageResizeHandle';

    frame.appendChild(image);
    frame.appendChild(handle);

    range.deleteContents();
    range.insertNode(frame);
    range.setStartAfter(frame);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    clearActiveEditorImage();
    frame.classList.add('active');
    syncEditorContent();
    saveEditorSelection();
  }

  function handleEditorImageSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = typeof reader.result === 'string' ? reader.result : '';
      if (imageUrl) insertEditorImage(imageUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleEditorClick(event) {
    const attachmentFrame = event.target.closest?.('.editorAttachmentFrame');
    if (attachmentFrame && editorRef.current?.contains(attachmentFrame)) {
      clearActiveEditorObjects();
      attachmentFrame.classList.add('active');
      return;
    }

    const imageFrame = event.target.closest?.('.editorImageFrame');
    if (imageFrame && editorRef.current?.contains(imageFrame)) {
      clearActiveEditorObjects();
      imageFrame.classList.add('active');
      return;
    }
    clearActiveEditorObjects();

    const link = event.target.closest?.('a');
    if (!link || !editorRef.current?.contains(link)) return;
    const href = link.getAttribute('href');
    if (!href) return;
    event.preventDefault();
    window.open(normalizeEditorUrl(href), '_blank', 'noopener,noreferrer');
  }

  function handleEditorDoubleClick(event) {
    const attachmentFrame = event.target.closest?.('.editorAttachmentFrame');
    if (!attachmentFrame || !editorRef.current?.contains(attachmentFrame)) return;
    event.preventDefault();
    openEditorAttachmentPreview(attachmentFrame);
  }

  function getEditorDropRange(clientX, clientY) {
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(clientX, clientY);
    }

    if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(clientX, clientY);
      if (!position) return null;
      const range = document.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
      return range;
    }

    return null;
  }

  function removeImageDropMarker() {
    imageDropMarkerRef.current?.remove();
    imageDropMarkerRef.current = null;
  }

  function removeImageDragGhost() {
    imageDragGhostRef.current?.remove();
    imageDragGhostRef.current = null;
  }

  function removeCustomImageDragListeners() {
    document.removeEventListener('mousemove', handleCustomImageDragMove, true);
    document.removeEventListener('mouseup', stopCustomImageDrag, true);
    window.removeEventListener('blur', stopCustomImageDrag);
    document.removeEventListener('visibilitychange', stopCustomImageDrag);
  }

  function updateImageDragGhost(clientX, clientY) {
    const dragState = imageDragStateRef.current;
    const ghost = imageDragGhostRef.current;
    if (!dragState || !ghost) return;

    const left = clientX - dragState.pointerOffsetX;
    const top = clientY - dragState.pointerOffsetY;
    ghost.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }

  function ensureImageDropMarker(frame) {
    if (imageDropMarkerRef.current) return imageDropMarkerRef.current;
    const marker = document.createElement('span');
    marker.className = 'editorImageDropMarker';
    marker.style.width = frame.style.width || `${Math.round(frame.getBoundingClientRect().width)}px`;
    marker.style.height = `${Math.round(frame.getBoundingClientRect().height)}px`;
    marker.style.display = frame.style.display || 'inline-block';
    marker.style.marginLeft = frame.style.marginLeft;
    marker.style.marginRight = frame.style.marginRight;
    imageDropMarkerRef.current = marker;
    return marker;
  }

  function placeImageDropMarker(frame, clientX, clientY) {
    const editor = editorRef.current;
    if (!editor) return false;

    const range = getEditorDropRange(clientX, clientY);
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      return false;
    }

    const marker = ensureImageDropMarker(frame);
    if (marker.contains(range.commonAncestorContainer)) {
      return true;
    }
    const targetFrame = range.startContainer?.nodeType === Node.ELEMENT_NODE
      ? range.startContainer.closest?.('.editorImageFrame')
      : range.startContainer?.parentElement?.closest?.('.editorImageFrame');

    if (targetFrame && targetFrame !== frame) {
      const targetRect = targetFrame.getBoundingClientRect();
      if (clientY > targetRect.top + targetRect.height / 2) {
        targetFrame.parentNode?.insertBefore(marker, targetFrame.nextSibling);
      } else {
        targetFrame.parentNode?.insertBefore(marker, targetFrame);
      }
      return true;
    }

    range.insertNode(marker);
    return true;
  }

  function finishImageDrop(frame) {
    const marker = imageDropMarkerRef.current;
    if (!marker?.parentNode || !editorRef.current) return false;

    marker.replaceWith(frame);
    imageDropMarkerRef.current = null;
    clearActiveEditorImage();
    frame.classList.add('active');

    const selection = window.getSelection();
    const range = document.createRange();
    range.setStartAfter(frame);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    syncEditorContent();
    saveEditorSelection();
    return true;
  }

  function restoreImageFrameAfterCanceledDrag(dragState) {
    const { frame, originalParent, originalNextSibling } = dragState;
    if (frame.isConnected) return;

    if (originalParent?.isConnected) {
      originalParent.insertBefore(
        frame,
        originalNextSibling?.parentNode === originalParent ? originalNextSibling : null,
      );
      return;
    }

    const marker = imageDropMarkerRef.current;
    if (marker?.parentNode) {
      marker.parentNode.insertBefore(frame, marker);
      return;
    }

    editorRef.current?.appendChild(frame);
  }

  function stopCustomImageDrag(event) {
    const dragState = imageDragStateRef.current;
    if (!dragState) return;

    const { frame, hasMoved } = dragState;
    removeCustomImageDragListeners();
    frame.classList.remove('dragging');
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');

    const dropped = hasMoved ? finishImageDrop(frame) : false;

    if (!dropped) {
      restoreImageFrameAfterCanceledDrag(dragState);
    }

    imageDragStateRef.current = null;
    removeImageDragGhost();
    removeImageDropMarker();
  }

  function handleCustomImageDragMove(event) {
    const dragState = imageDragStateRef.current;
    if (!dragState) return;

    const movedX = event.clientX - dragState.startX;
    const movedY = event.clientY - dragState.startY;
    if (!dragState.hasMoved && Math.hypot(movedX, movedY) < 6) {
      return;
    }

    dragState.hasMoved = true;
    dragState.frame.classList.add('dragging');
    if (!dragState.placeholderInserted) {
      const marker = ensureImageDropMarker(dragState.frame);
      dragState.frame.parentNode?.replaceChild(marker, dragState.frame);
      dragState.placeholderInserted = true;
    }
    updateImageDragGhost(event.clientX, event.clientY);
    placeImageDropMarker(dragState.frame, event.clientX, event.clientY);
    event.preventDefault();
  }

  function beginCustomImageDrag(frame, startEvent) {
    startEvent.preventDefault();
    const frameRect = frame.getBoundingClientRect();
    const ghost = frame.cloneNode(true);
    ghost.classList.remove('active');
    ghost.classList.add('dragGhost');
    ghost.style.width = `${Math.round(frameRect.width)}px`;
    ghost.style.height = `${Math.round(frameRect.height)}px`;
    ghost.style.marginLeft = '0';
    ghost.style.marginRight = '0';
    document.body.appendChild(ghost);
    imageDragGhostRef.current = ghost;

    imageDragStateRef.current = {
      frame,
      startX: startEvent.clientX,
      startY: startEvent.clientY,
      hasMoved: false,
      placeholderInserted: false,
      originalParent: frame.parentNode,
      originalNextSibling: frame.nextSibling,
      pointerOffsetX: startEvent.clientX - frameRect.left,
      pointerOffsetY: startEvent.clientY - frameRect.top,
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    updateImageDragGhost(startEvent.clientX, startEvent.clientY);
    document.addEventListener('mousemove', handleCustomImageDragMove, true);
    document.addEventListener('mouseup', stopCustomImageDrag, true);
    window.addEventListener('blur', stopCustomImageDrag);
    document.addEventListener('visibilitychange', stopCustomImageDrag);
  }

  function handleEditorWheel(event) {
    const imageFrame = event.target.closest?.('.editorImageFrame');
    if (!imageFrame || !editorRef.current?.contains(imageFrame)) return;

    event.preventDefault();
    clearActiveEditorImage();
    imageFrame.classList.add('active');

    const currentWidth = imageFrame.getBoundingClientRect().width;
    const direction = event.deltaY < 0 ? 1 : -1;
    setEditorImageWidth(imageFrame, currentWidth + direction * EDITOR_IMAGE_WHEEL_STEP);
    syncEditorContent();
  }

  function handleEditorMouseDown(event) {
    const handle = event.target.closest?.('.editorImageResizeHandle');
    if (handle && editorRef.current?.contains(handle)) {
      const frame = handle.closest('.editorImageFrame');
      if (!frame) return;

      event.preventDefault();
      clearActiveEditorImage();
      frame.classList.add('active');

      const startX = event.clientX;
      const startWidth = frame.getBoundingClientRect().width;

      function resizeImage(moveEvent) {
        moveEvent.preventDefault();
        setEditorImageWidth(frame, startWidth + moveEvent.clientX - startX);
      }

      function finishResize() {
        window.removeEventListener('mousemove', resizeImage);
        window.removeEventListener('mouseup', finishResize);
        syncEditorContent();
      }

      window.addEventListener('mousemove', resizeImage);
      window.addEventListener('mouseup', finishResize);
      return;
    }

    const frame = event.target.closest?.('.editorImageFrame');
    if (!frame || !editorRef.current?.contains(frame)) return;

    event.preventDefault();
    clearActiveEditorImage();
    frame.classList.add('active');
    beginCustomImageDrag(frame, event);
  }

  function handleEditorKeyDown(event) {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;

    const activeObject = editorRef.current?.querySelector('.editorImageFrame.active, .editorAttachmentFrame.active');
    if (!activeObject) return;

    event.preventDefault();
    activeObject.remove();
    syncEditorContent();
    editorRef.current?.focus();
  }

  function deleteWorkflow(workflowId) {
    if (!selectedCustomer) return;
    const timeline = selectedCustomer.timeline ?? [];
    const target = timeline.find((item) => item.id === workflowId);
    setPendingDelete({
      type: 'workflow',
      id: workflowId,
      title: '删除工作流',
      message: `确定删除「${target?.title ?? '沟通记录'}」这个工作流吗？对应文档内容也会一起删除。`,
    });
  }

  function performDeleteWorkflow(workflowId) {
    if (!selectedCustomer) return;
    const timeline = selectedCustomer.timeline ?? [];
    const nextTimeline = timeline.filter((item) => item.id !== workflowId);
    const nextSelectedWorkflow = nextTimeline[0]?.id ?? '';
    updateCustomer(selectedCustomer.id, {
      timeline: nextTimeline,
      lastFollowDate: nextTimeline[0]?.date ?? selectedCustomer.lastFollowDate,
      messyNotes: selectedWorkflow?.id === workflowId
        ? nextTimeline[0]?.documentContent ?? nextTimeline[0]?.content ?? ''
        : selectedCustomer.messyNotes,
    });
    setSelectedWorkflowId(nextSelectedWorkflow);
    setSelectedWorkflowIds((current) => current.filter((item) => item !== workflowId));
    if (editingWorkflowTitleId === workflowId) {
      setEditingWorkflowTitleId('');
    }
  }

  function confirmPendingDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'customer') {
      performDeleteCustomer(pendingDelete.id);
    }
    if (pendingDelete.type === 'workflow') {
      performDeleteWorkflow(pendingDelete.id);
    }
    setPendingDelete(null);
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <div className="brand">
          <div className="brandMark">
            <Database size={24} />
          </div>
          <div>
            <h1>个人工作流管理</h1>
          </div>
        </div>
        <div className="topActions">
          <button type="button" className="topTextButton" title="备份数据" onClick={exportBackupData}>
            <Download size={19} />
            <span>备份数据</span>
          </button>
          <button type="button" className="topTextButton" title="导入数据" onClick={() => backupInputRef.current?.click()}>
            <Upload size={19} />
            <span>导入数据</span>
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={importBackupData}
          />
          <button type="button" className="topIconButton" title="设置">
            <Settings size={19} />
          </button>
        </div>
      </header>

      <section
        ref={boardRef}
        style={boardStyle}
        className={`board ${leftCollapsed ? 'leftCollapsed' : ''} ${rightCollapsed ? 'rightCollapsed' : ''} ${activeResizer ? 'isResizing' : ''}`}
      >
        <aside className={`panel sourcePanel ${leftCollapsed ? 'collapsedPanel' : ''}`}>
          <PanelTitle
            title="用户列表"
            icon={<UserRound size={18} />}
            meta={`${stats.total} 位用户`}
            collapsed={leftCollapsed}
            onToggle={toggleLeftCollapsed}
            toggleTitle={leftCollapsed ? '展开用户列表' : '收起用户列表'}
            toggleIcon={leftCollapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
          />
          {leftCollapsed ? (
            <CollapsedCustomerRail
              customers={filteredCustomers}
              selectedId={selectedCustomer?.id}
              onSelect={selectCustomer}
            />
          ) : (
            <>
          <div className="searchBox">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、联系人、国家或邮箱" />
          </div>
          <div className="gradeTabs">
            {['全部', ...CUSTOMER_GRADES].map((grade) => (
              <button key={grade} className={gradeFilter === grade ? 'active' : ''} onClick={() => setGradeFilter(grade)}>
                {grade}
              </button>
            ))}
          </div>
          <DndContext
            sensors={dragSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCustomerDragEnd}
          >
            <SortableContext items={filteredCustomers.map((customer) => customer.id)} strategy={verticalListSortingStrategy}>
              <div className="customerList">
                {filteredCustomers.map((customer) => (
                  <SortableCustomerRow
                    key={customer.id}
                    customer={customer}
                    isSelected={selectedCustomer?.id === customer.id}
                    onSelect={selectCustomer}
                    onDelete={requestDeleteCustomer}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="listFooter">
            <span>共 {filteredCustomers.length} 条</span>
            <div className="pager">
              <button><ChevronLeft size={16} /></button>
              <button className="pageActive">1</button>
              <button><ChevronRight size={16} /></button>
            </div>
          </div>
            </>
          )}
        </aside>

        <div
          className={`panelResizer ${leftCollapsed ? 'disabled' : ''}`}
          onPointerDown={() => startResize('left')}
          role="separator"
          aria-orientation="vertical"
          aria-label="调整用户列表宽度"
        />

        <section className="panel conversationPanel">
          <PanelTitle
            title={selectedCustomerTitle}
            icon={<MessageSquareText size={18} />}
            action={(
              <div className="panelHeaderActions">
                <button
                  type="button"
                  className="panelGhostButton"
                  onClick={toggleEditorExpanded}
                  title={editorExpanded ? '恢复两侧栏' : '展开编辑区'}
                  aria-label={editorExpanded ? '恢复两侧栏' : '展开编辑区'}
                >
                  {editorExpanded ? <Shrink size={16} /> : <Expand size={16} />}
                </button>
              </div>
            )}
          />
          {selectedCustomer ? (
            <div className="conversationBody">
              <div className="editorShell">
                <div className="editorToolbar">
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => applyEditorCommand('undo')} title="撤销">
                    <Undo2 size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => applyEditorCommand('redo')} title="重做">
                    <Redo2 size={16} />
                  </button>
                  <span />
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => applyEditorCommand('bold')} title="加粗">
                    <Bold size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={toggleEditorItalic} title="斜体">
                    <Italic size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => applyEditorCommand('underline')} title="下划线">
                    <Underline size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={clearEditorFormatting} title="清空格式">
                    <Eraser size={16} />
                  </button>
                  <span />
                  <EditorSizePicker
                    sizes={EDITOR_FONT_SIZES}
                    onPick={(fontSize) => applyEditorStyle({ fontSize })}
                  />
                  <EditorColorPicker
                    label="文字颜色"
                    trigger="A"
                    colors={EDITOR_TEXT_COLORS}
                    currentColor={activeEditorTextColor}
                    swatchClassName="textSwatch"
                    onPick={applyEditorTextColor}
                  />
                  <EditorColorPicker
                    label="背景色"
                    trigger="□"
                    colors={EDITOR_BACKGROUND_COLORS}
                    currentColor={activeEditorBackgroundColor}
                    swatchClassName="backgroundSwatch"
                    onPick={applyEditorBackgroundColor}
                  />
                  <span />
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => applyEditorCommand('insertUnorderedList')} title="圆点列表">
                    <List size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => applyEditorCommand('insertOrderedList')} title="数字列表">
                    <ListOrdered size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={addEditorLink} title="插入链接">
                    <Link size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={addEditorImage} title="插入图片">
                    <Image size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={addEditorAttachment} title="上传附件">
                    <FileText size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => alignEditorImage('left')} title="图片左对齐">
                    <AlignLeft size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => alignEditorImage('center')} title="图片居中对齐">
                    <AlignCenter size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => alignEditorImage('right')} title="图片右对齐">
                    <AlignRight size={16} />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleEditorImageSelected}
                  />
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept={EDITOR_ATTACHMENT_ACCEPT}
                    multiple
                    hidden
                    onChange={handleEditorAttachmentSelected}
                  />
                </div>
                <div
                  key={editorKey}
                  ref={editorRef}
                  className={`messyContent ${isMergedWorkflowView ? 'mergedViewContent' : ''}`}
                  contentEditable={canEditEditor}
                  suppressContentEditableWarning
                  onInput={syncEditorContent}
                  onMouseDown={handleEditorMouseDown}
                  onMouseUp={saveEditorSelection}
                  onKeyDown={handleEditorKeyDown}
                  onKeyUp={saveEditorSelection}
                  onFocus={saveEditorSelection}
                  onClick={handleEditorClick}
                  onDoubleClick={handleEditorDoubleClick}
                  onWheel={handleEditorWheel}
                  data-placeholder={isMergedWorkflowView
                    ? '请选择至少一个工作流进行合并查看。'
                    : selectedWorkflow
                      ? '编辑当前工作流对应的文档内容。'
                      : '请先添加或选择一个工作流。'}
                />
                <div className="wordCount">字数 · {editorWordCount}</div>
              </div>

              <div className="composer">
                <MessageSquareText size={18} />
                <input
                  className="composerTitle"
                  value={noteTitleDraft}
                  onChange={(event) => setNoteTitleDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addMessyNote();
                  }}
                  placeholder="输入标题"
                />
                <div className="composerActions">
                  <button type="button" className="composerIconButton" onClick={addMessyNote}>
                    <Send size={19} />
                  </button>
                  <button type="button" className="composerAddButton" onClick={addCustomer}>
                    <Plus size={16} />
                    添加用户
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState text="暂无用户，请先添加一个用户。" />
          )}
        </section>

        <div
          className={`panelResizer ${rightCollapsed ? 'disabled' : ''}`}
          onPointerDown={() => startResize('right')}
          role="separator"
          aria-orientation="vertical"
          aria-label="调整用户档案宽度"
        />

        <aside className={`panel studioPanel ${rightCollapsed ? 'collapsedPanel' : ''}`}>
          <PanelTitle
            title="用户档案"
            icon={<FileText size={18} />}
            action={selectedCustomer && (
              <div className="archiveTitleActions">
                {archiveEditing && (
                  <button className="archiveGlobalSaveButton" onClick={saveArchiveAsGlobalFields}>
                    全局保存
                  </button>
                )}
                <button className={`archiveEditButton ${archiveEditing ? 'savingMode' : ''}`} onClick={toggleArchiveEditing}>
                  {archiveEditing ? '当前保存' : '编辑档案'}
                </button>
              </div>
            )}
            collapsed={rightCollapsed}
            onToggle={toggleRightCollapsed}
            toggleTitle={rightCollapsed ? '展开用户档案' : '收起用户档案'}
            toggleIcon={rightCollapsed ? <ChevronsLeft size={17} /> : <ChevronsRight size={17} />}
          />
          {rightCollapsed ? (
            <CollapsedWorkflowRail
              workflows={selectedCustomer?.timeline ?? []}
              selectedWorkflowId={selectedWorkflow?.id}
              onSelect={selectSingleWorkflow}
            />
          ) : selectedCustomer ? (
            <div className="archiveScroll">
              <div className="archiveCard">
                <div className="archiveHero">
                  <BrandLogo company={archiveCustomer.company} large />
                  <div className="archiveIdentity">
                    <div className="archiveNameLine">
                      <input
                        style={{
                          width: `${Math.max(
                            ((archiveCustomer.company || '未命名公司').trim().length || 2) * 1.15 + 0.35,
                            2.7,
                          )}em`,
                        }}
                        value={archiveCustomer.company ?? ''}
                        onChange={(event) => updateArchiveDraft('company', event.target.value)}
                        disabled={!archiveEditing}
                        placeholder="未命名公司"
                      />
                      <GradeBadge grade={archiveCustomer.grade} compact />
                    </div>
                    <span>{gradeMap[archiveCustomer.grade] ? `${gradeMap[archiveCustomer.grade]} · ` : ''}{archiveCustomer.country || '未填写国家'}</span>
                  </div>
                </div>

                <div className="archiveInfoGrid">
                  {archiveFields.map(([key, label]) => (
                    <ArchiveField
                      key={key}
                      label={getArchiveFieldLabel(archiveCustomer, globalFieldLabels, key, label)}
                      defaultLabel={label}
                      fieldKey={key}
                      archiveCustomer={archiveCustomer}
                      editing={archiveEditing}
                      editingLabel={archiveDraft?.fieldLabels?.[key] ?? getArchiveFieldLabel(selectedCustomer, globalFieldLabels, key, label)}
                      updateArchiveDraft={updateArchiveDraft}
                      updateArchiveFieldLabel={updateArchiveFieldLabel}
                    />
                  ))}
                </div>

                <div className="archiveWorkflowBlock">
                  <div className="archiveWorkflowHeader">
                    <div className="archiveWorkflowHeading">
                      <h3>最近工作流</h3>
                      <div className="workflowViewSwitch" role="tablist" aria-label="工作流查看模式">
                        <button
                          type="button"
                          className={workflowViewMode === 'single' ? 'active' : ''}
                          onClick={() => changeWorkflowViewMode('single')}
                        >
                          单独查看
                        </button>
                        <button
                          type="button"
                          className={workflowViewMode === 'merged' ? 'active' : ''}
                          onClick={() => changeWorkflowViewMode('merged')}
                        >
                          合并查看
                        </button>
                      </div>
                    </div>
                    <div className="archiveWorkflowActions">
                      <button
                        className="archiveDeleteWorkflowButton"
                        onClick={() => activeWorkflowForActions && deleteWorkflow(activeWorkflowForActions.id)}
                        disabled={!activeWorkflowForActions}
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </div>

                  <div className={`archiveTimeline ${(selectedCustomer.timeline ?? []).length === 0 ? 'emptyTimeline' : ''}`}>
                  {(selectedCustomer.timeline ?? []).map((item) => {
                    const editingTitle = editingWorkflowTitleId === item.id;
                    const isSelected = isMergedWorkflowView
                      ? selectedWorkflowIds.includes(item.id)
                      : selectedWorkflow?.id === item.id;

                    return (
                      <div
                        className={`archiveTimelineRow ${isSelected ? 'selectedWorkflow' : ''}`}
                        key={item.id}
                        onClick={() => {
                          if (isMergedWorkflowView) {
                            toggleMergedWorkflow(item.id);
                            return;
                          }
                          selectSingleWorkflow(item.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Delete' || event.key === 'Backspace') {
                            event.preventDefault();
                            deleteWorkflow(item.id);
                            return;
                          }
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            if (isMergedWorkflowView) {
                              toggleMergedWorkflow(item.id);
                              return;
                            }
                            selectSingleWorkflow(item.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="archiveTimelineDate">{item.date}</div>
                        <div className="timelineRail">
                          <span className={`statusDot status${item.status}`} />
                        </div>
                        <div className="archiveTimelineContent">
                          <input
                            className={`workflowContentInput ${editingTitle ? 'editingTitle' : ''}`}
                            value={item.title ?? '沟通记录'}
                            readOnly={!editingTitle}
                            title={editingTitle ? '编辑标题，按回车完成' : '双击修改标题'}
                            onFocus={() => focusWorkflow(item.id)}
                            onClick={(event) => {
                              if (isMergedWorkflowView) {
                                event.stopPropagation();
                                toggleMergedWorkflow(item.id);
                                return;
                              }
                              event.stopPropagation();
                            }}
                            onDoubleClick={(event) => {
                              event.stopPropagation();
                              focusWorkflow(item.id);
                              setEditingWorkflowTitleId(item.id);
                              requestAnimationFrame(() => {
                                event.currentTarget.focus();
                                event.currentTarget.select();
                              });
                            }}
                            onBlur={() => setEditingWorkflowTitleId('')}
                            onKeyDown={(event) => {
                              event.stopPropagation();
                              if (event.key === 'Enter') {
                                event.currentTarget.blur();
                              }
                              if (event.key === 'Escape') {
                                setEditingWorkflowTitleId('');
                                event.currentTarget.blur();
                              }
                            }}
                            onChange={(event) => {
                              if (!editingTitle) return;
                              updateWorkflow(item.id, { title: event.target.value });
                            }}
                          />
                        </div>
                        <label className="workflowPick" onClick={(event) => event.stopPropagation()}>
                          <input
                            type={isMergedWorkflowView ? 'checkbox' : 'radio'}
                            name={isMergedWorkflowView ? undefined : 'selectedWorkflow'}
                            checked={isSelected}
                            onChange={() => {
                              if (isMergedWorkflowView) {
                                toggleMergedWorkflow(item.id);
                                return;
                              }
                              selectSingleWorkflow(item.id);
                            }}
                            aria-label={`${isMergedWorkflowView ? '合并选择' : '选择'} ${item.title ?? item.content ?? '工作流'}`}
                          />
                          <span />
                        </label>
                        <div className="workflowControls">
                          <select
                            value={item.status}
                            className={`statusSelect status${item.status}`}
                            onFocus={() => focusWorkflow(item.id)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => updateWorkflow(item.id, { status: event.target.value })}
                          >
                            {['跟进中', '待确认', '已完成', '暂停'].map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  {(selectedCustomer.timeline ?? []).length === 0 && (
                    <div className="workflowEmpty">暂无跟进记录</div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState text="请选择一个用户查看档案。" />
          )}
        </aside>
      </section>
      {pendingDelete && (
        <ConfirmDialog
          title={pendingDelete.title}
          message={pendingDelete.message}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmPendingDelete}
        />
      )}
      {pendingImport && (
        <ImportBackupDialog
          stats={pendingImport.stats}
          onCancel={() => setPendingImport(null)}
          onOverwrite={() => applyImportedBackup(pendingImport.payload, 'overwrite', pendingImport.importedCustomers)}
          onAppend={() => applyImportedBackup(pendingImport.payload, 'append', pendingImport.importedCustomers)}
        />
      )}
      {attachmentPreview && (
        <AttachmentPreviewDialog
          preview={attachmentPreview}
          onClose={() => setAttachmentPreview(null)}
        />
      )}
    </main>
  );
}

function PanelTitle({ title, icon, meta, action, collapsed = false, onToggle, toggleIcon, toggleTitle }) {
  return (
    <div className="panelTitle">
      <div>
        {icon}
        {!collapsed && <h2>{title}</h2>}
      </div>
      {!collapsed && <span>{meta}</span>}
      {!collapsed && action}
      {onToggle && (
        <button className="collapseButton" onClick={onToggle} title={toggleTitle}>
          {toggleIcon}
        </button>
      )}
    </div>
  );
}

function EditorColorPicker({ label, trigger, colors, currentColor, swatchClassName, onPick }) {
  return (
    <div className="toolbarColorPicker" title={label}>
      <button
        type="button"
        className={`toolbarColorTrigger ${swatchClassName}`}
        style={{ '--active-color': currentColor }}
        onMouseDown={(event) => event.preventDefault()}
        aria-label={label}
      >
        {trigger}
        <ChevronDown size={10} />
      </button>
      <div className="toolbarColorPopover" role="menu" aria-label={label}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`toolbarSwatch ${swatchClassName}`}
            style={{ '--swatch-color': color }}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(color)}
            aria-label={`${label} ${color}`}
          />
        ))}
      </div>
    </div>
  );
}

function EditorSizePicker({ sizes, onPick }) {
  return (
    <div className="toolbarSizePicker" title="设置字号">
      <button
        type="button"
        className="toolbarSizeTrigger"
        onMouseDown={(event) => event.preventDefault()}
        aria-label="设置字号"
      >
        字号
        <ChevronDown size={10} />
      </button>
      <div className="toolbarSizePopover" role="menu" aria-label="设置字号">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            className="toolbarSizeOption"
            style={{ fontSize: size }}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}

function CollapsedWorkflowRail({ workflows, selectedWorkflowId, onSelect }) {
  const visibleWorkflows = workflows.slice(0, 8);

  return (
    <div className="collapsedRail" title="最近工作流" aria-label="最近工作流">
      <div className="collapsedWorkflowList">
        {visibleWorkflows.map((workflow) => (
          <button
            key={workflow.id}
            className={`collapsedWorkflowButton ${workflow.id === selectedWorkflowId ? 'active' : ''}`}
            onClick={() => onSelect(workflow.id)}
            title={`${workflow.date} · ${workflow.title ?? workflow.content ?? '沟通记录'} · ${workflow.status}`}
            aria-label={`${workflow.date} ${workflow.title ?? workflow.content ?? '沟通记录'} ${workflow.status}`}
          >
            <span className={`statusDot status${workflow.status}`} />
            <small>{workflow.date?.slice(5).replace('-', '/')}</small>
          </button>
        ))}
        {visibleWorkflows.length === 0 && (
          <div className="collapsedWorkflowEmpty" title="暂无工作流">空</div>
        )}
      </div>
      <strong>{workflows.length}</strong>
    </div>
  );
}

function CollapsedCustomerRail({ customers, selectedId, onSelect }) {
  return (
    <div className="collapsedCustomerRail">
      <div className="collapsedCustomerList">
        {customers.map((customer) => (
          <button
            key={customer.id}
            className={`collapsedCustomerButton ${customer.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelect(customer.id)}
            title={`${customer.company || '未命名客户'} · ${customer.contact || '未填写联系人'}`}
          >
            <BrandLogo company={customer.company} />
          </button>
        ))}
      </div>
      <strong>{customers.length}</strong>
    </div>
  );
}

function SortableCustomerRow({ customer, isSelected, onSelect, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id: customer.id });

  return (
    <div
      className="sortableCustomerRow"
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
        transition,
      }}
    >
      <CustomerRowCard
        customer={customer}
        isSelected={isSelected}
        onSelect={onSelect}
        onDelete={onDelete}
        className={isDragging ? 'dragging' : isSorting ? 'sorting' : ''}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
}

function CustomerRowCard({
  customer,
  isSelected,
  onSelect,
  onDelete,
  className = '',
  dragAttributes,
  dragListeners,
  dragging = false,
  overlay = false,
}) {
  return (
    <div
      className={`customerRow ${isSelected ? 'selected' : ''} ${dragging ? 'dragging' : ''} ${overlay ? 'overlay' : ''} ${className}`.trim()}
      onClick={() => onSelect(customer.id)}
      onKeyDown={(event) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          onDelete(customer);
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') onSelect(customer.id);
      }}
      role="button"
      tabIndex={0}
      {...dragAttributes}
      {...dragListeners}
    >
      <BrandLogo company={customer.company} />
      <div className="customerText">
        <strong>{customer.company || '未命名公司'}</strong>
        <span>{customer.contact || '未填写联系人'} · {customer.country || '未知国家'}</span>
      </div>
      <div className="customerBadges">
        <button
          type="button"
          className="customerDeleteButton"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(customer);
          }}
          title="删除用户"
          aria-label={`删除 ${customer.company || '未命名客户'}`}
        >
          <Trash2 size={13} />
        </button>
        <GradeBadge grade={customer.grade} />
      </div>
    </div>
  );
}

function BrandLogo({ company, large = false }) {
  const lower = company?.toLowerCase() ?? '';
  const cls = lower.includes('华为') ? 'huawei' : lower.includes('小米') ? 'xiaomi' : lower.includes('三星') ? 'samsung' : 'generic';
  const text = lower.includes('华为') ? '✹' : lower.includes('小米') ? 'mi' : lower.includes('三星') ? 'SAMSUNG' : company?.slice(0, 1) || '新';
  const palette = getLogoPalette(company);
  const style = cls === 'generic'
    ? { '--logo-from': palette[0], '--logo-to': palette[1], '--logo-text': palette[2] }
    : undefined;
  return <div className={`brandLogo ${cls} ${large ? 'large' : ''}`} style={style}>{text}</div>;
}

function getLogoPalette(value = '') {
  const palettes = [
    ['#0f766e', '#14b8a6', '#ffffff'],
    ['#7c3aed', '#a78bfa', '#ffffff'],
    ['#be123c', '#fb7185', '#ffffff'],
    ['#0369a1', '#38bdf8', '#ffffff'],
    ['#b45309', '#f59e0b', '#ffffff'],
    ['#166534', '#22c55e', '#ffffff'],
    ['#4338ca', '#818cf8', '#ffffff'],
    ['#475569', '#94a3b8', '#ffffff'],
  ];
  const seed = Array.from(value || '新').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[seed % palettes.length];
}

function GradeBadge({ grade, compact = false }) {
  return (
    <span className={`gradeBadge grade${grade} ${compact ? 'compactGradeBadge' : ''}`}>
      <Star size={13} />
      {grade}
    </span>
  );
}

function normalizeWebsiteUrl(value = '') {
  const url = value.trim();
  if (!url) return '';
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) return url;
  return `https://${url}`;
}

function normalizeEmailHref(value = '') {
  const email = value.trim();
  if (!email) return '';
  return `mailto:${email}`;
}

function ArchiveField({ label, defaultLabel, fieldKey, archiveCustomer, editing, editingLabel, updateArchiveDraft, updateArchiveFieldLabel }) {
  const isGrade = fieldKey === 'grade';
  const fieldValue = archiveCustomer[fieldKey] ?? '';
  const linkHref = fieldKey === 'website'
    ? normalizeWebsiteUrl(fieldValue)
    : fieldKey === 'email'
      ? normalizeEmailHref(fieldValue)
      : '';

  return (
    <div className={`archiveField ${isGrade ? 'selectInput' : ''} ${editing ? 'editingField' : ''}`}>
      <span className="archiveFieldLabel">
        {editing ? (
          <span
            className="archiveFieldLabelText"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={`修改字段名：${defaultLabel}`}
            onBlur={(event) => updateArchiveFieldLabel(fieldKey, event.currentTarget.textContent?.trim() || defaultLabel)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          >
            {editingLabel}
          </span>
        ) : (
          label
        )}
      </span>
      {isGrade ? (
        <select
          value={archiveCustomer.grade}
          disabled={!editing}
          onChange={(event) => updateArchiveDraft('grade', event.target.value)}
        >
          {CUSTOMER_GRADES.map((grade) => (
            <option key={grade} value={grade}>{grade} - {gradeMap[grade]}</option>
          ))}
        </select>
      ) : linkHref && !editing ? (
        <a
          className="archiveFieldValueLink"
          href={linkHref}
          target={fieldKey === 'website' ? '_blank' : undefined}
          rel={fieldKey === 'website' ? 'noopener noreferrer' : undefined}
          title={fieldValue}
        >
          {fieldValue}
        </a>
      ) : (
        <input
          value={fieldValue}
          disabled={!editing}
          onChange={(event) => updateArchiveDraft(fieldKey, event.target.value)}
          placeholder="未填写"
        />
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="emptyState">{text}</div>;
}

function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  return (
    <div className="confirmOverlay" role="presentation" onMouseDown={onCancel}>
      <div className="confirmDialog" role="dialog" aria-modal="true" aria-labelledby="confirmTitle" onMouseDown={(event) => event.stopPropagation()}>
        <div className="confirmIcon">
          <Trash2 size={20} />
        </div>
        <div className="confirmContent">
          <h3 id="confirmTitle">{title}</h3>
          <p>{message}</p>
        </div>
        <div className="confirmActions">
          <button className="confirmCancel" onClick={onCancel}>取消</button>
          <button className="confirmDanger" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  );
}

function ImportBackupDialog({ stats, onCancel, onOverwrite, onAppend }) {
  return (
    <div className="confirmOverlay" role="presentation" onMouseDown={onCancel}>
      <div className="confirmDialog importDialog" role="dialog" aria-modal="true" aria-labelledby="importTitle" onMouseDown={(event) => event.stopPropagation()}>
        <div className="confirmIcon importIcon">
          <Upload size={20} />
        </div>
        <div className="confirmContent">
          <h3 id="importTitle">导入数据</h3>
          <p>备份文件中共有 {stats.totalCount} 条客户数据，新增 {stats.newCount} 条，重复 {stats.duplicateCount} 条。</p>
        </div>
        <div className="importStats">
          <div>
            <span>新增</span>
            <strong>{stats.newCount}</strong>
          </div>
          <div>
            <span>重复</span>
            <strong>{stats.duplicateCount}</strong>
          </div>
        </div>
        <div className="confirmActions importActions">
          <button className="confirmCancel" onClick={onCancel}>取消</button>
          <button className="confirmCancel" onClick={onAppend} disabled={stats.newCount === 0}>追加新增数据</button>
          <button className="confirmDanger" onClick={onOverwrite}>覆盖当前数据</button>
        </div>
      </div>
    </div>
  );
}

function AttachmentPreviewDialog({ preview, onClose }) {
  const downloadName = preview.name || '附件';

  return (
    <div className="confirmOverlay attachmentPreviewOverlay" role="presentation" onMouseDown={onClose}>
      <div className={`attachmentPreviewDialog ${preview.status === 'unsupported' ? 'compactPreviewDialog' : ''}`} role="dialog" aria-modal="true" aria-labelledby="attachmentPreviewTitle" onMouseDown={(event) => event.stopPropagation()}>
        <div className="attachmentPreviewHeader">
          <div>
            <h3 id="attachmentPreviewTitle">{preview.name}</h3>
          </div>
          <div className="attachmentPreviewActions">
            <a href={preview.url} download={downloadName}>下载</a>
            <button type="button" onClick={onClose}>关闭</button>
          </div>
        </div>
        <div className="attachmentPreviewBody">
          {preview.status === 'loading' && <div className="attachmentPreviewEmpty">正在加载预览</div>}
          {preview.status === 'error' && <div className="attachmentPreviewEmpty">{preview.message || '预览失败'}</div>}
          {preview.status === 'unsupported' && <div className="attachmentPreviewEmpty">当前格式暂不支持网页预览，请下载后查看。</div>}
          {preview.status === 'ready' && preview.kind === 'pdf' && (
            <iframe src={preview.url} title={preview.name} />
          )}
          {preview.status === 'ready' && preview.kind === 'word' && (
            <div className="attachmentWordPreview" dangerouslySetInnerHTML={{ __html: preview.html }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
