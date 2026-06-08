import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bell,
  Bold,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Eraser,
  Expand,
  File,
  FileText,
  Image,
  Italic,
  Link,
  List,
  MessageSquareText,
  Shrink,
  Pin,
  Plus,
  Redo2,
  Search,
  Send,
  Settings,
  Star,
  Tag,
  Trash2,
  Underline,
  Undo2,
  UserRound,
} from 'lucide-react';

const STORAGE_KEY = 'personal-workflow-manager-v1';
const LAYOUT_STORAGE_KEY = 'personal-workflow-manager-layout-v1';
const CUSTOMER_GRADES = ['A', 'B', 'C', 'D'];
const EDITOR_FONT_SIZES = ['12px', '14px', '16px', '18px', '22px', '28px', '36px'];
const EDITOR_TEXT_COLORS = ['#111111', '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed'];
const EDITOR_BACKGROUND_COLORS = ['#fff7ad', '#fee2e2', '#dbeafe', '#dcfce7', '#f3e8ff', '#ffffff'];
const EDITOR_IMAGE_MIN_WIDTH = 80;
const EDITOR_IMAGE_WHEEL_STEP = 32;

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
  ['serialNumber', '序号'],
  ['grade', '等级'],
  ['company', '客户名字'],
  ['country', '国家'],
  ['website', '网址'],
  ['contact', '联系人'],
  ['otherContact', 'whatsapp'],
  ['phone', '电话'],
  ['fax', 'signal'],
  ['email', 'email'],
  ['backup1', 'telegram'],
  ['backup2', 'wechat'],
  ['lastFollowDate', '最后跟进日期'],
  ['reminderDays', '提醒值'],
  ['backup3', '备用'],
  ['remark', '备注'],
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

function readInitialLayout() {
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { leftCollapsed: false, rightCollapsed: false };
  } catch {
    return { leftCollapsed: false, rightCollapsed: false };
  }
}

function saveLayout(layout) {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
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

function normalizeEditorUrl(value = '') {
  const url = value.trim();
  if (!url) return '';
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return `https://${url}`;
}

function makeArchiveDraft(customer) {
  if (!customer) return null;
  const draft = archiveFields.reduce((nextDraft, [key]) => {
    nextDraft[key] = customer[key] ?? '';
    return nextDraft;
  }, { id: customer.id });
  draft.fieldLabels = { ...(customer.fieldLabels ?? {}) };
  return draft;
}

function getArchiveFieldLabel(customer, fieldKey, defaultLabel) {
  return customer?.fieldLabels?.[fieldKey] || defaultLabel;
}

function normalizeFieldLabels(fieldLabels = {}) {
  return archiveFields.reduce((labels, [key, defaultLabel]) => {
    const label = fieldLabels[key]?.trim();
    if (label && label !== defaultLabel) {
      labels[key] = label;
    }
    return labels;
  }, {});
}

function App() {
  const initialLayout = readInitialLayout();
  const [customers, setCustomers] = useState(readInitialCustomers);
  const [selectedId, setSelectedId] = useState(customers[0]?.id ?? '');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('全部');
  const [noteTitleDraft, setNoteTitleDraft] = useState('');
  const [editingWorkflowTitleId, setEditingWorkflowTitleId] = useState('');
  const [archiveEditing, setArchiveEditing] = useState(false);
  const [archiveDraft, setArchiveDraft] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(initialLayout.leftCollapsed);
  const [rightCollapsed, setRightCollapsed] = useState(initialLayout.rightCollapsed);
  const [pendingDelete, setPendingDelete] = useState(null);
  const editorRef = useRef(null);
  const editorSelectionRef = useRef(null);
  const imageInputRef = useRef(null);

  const selectedCustomer = customers.find((customer) => customer.id === selectedId) ?? customers[0];
  const archiveCustomer = archiveEditing && archiveDraft?.id === selectedCustomer?.id
    ? archiveDraft
    : selectedCustomer;
  const selectedWorkflow = selectedCustomer?.timeline?.find((item) => item.id === selectedWorkflowId)
    ?? selectedCustomer?.timeline?.[0]
    ?? null;
  const editorContent = selectedWorkflow
    ? selectedWorkflow.documentContent ?? selectedWorkflow.content ?? ''
    : selectedCustomer?.messyNotes ?? '';
  const editorKey = selectedWorkflow ? selectedWorkflow.id : selectedCustomer?.id ?? 'empty-editor';
  const editorWordCount = useMemo(() => getTextLengthFromHtml(editorContent), [editorContent]);
  const selectedCustomerTitle = selectedCustomer
    ? [selectedCustomer.company || '未命名用户', selectedCustomer.contact, selectedCustomer.country].filter(Boolean).join(' · ')
    : '未命名用户';

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        const haystack = `${customer.company} ${customer.contact} ${customer.country} ${customer.email}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase()) && (gradeFilter === '全部' || customer.grade === gradeFilter);
      })
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  }, [customers, gradeFilter, query]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      active: customers.filter((customer) => customer.timeline?.[0]?.status !== '暂停').length,
    };
  }, [customers]);

  const activeWorkflowCount = selectedCustomer?.timeline?.filter((item) => item.status !== '暂停').length ?? 0;
  const editorExpanded = leftCollapsed && rightCollapsed;

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = toEditorHtml(editorContent);
    prepareEditorImages();
    editorSelectionRef.current = null;
  }, [editorKey]);

  useEffect(() => {
    setArchiveEditing(false);
    setArchiveDraft(null);
  }, [selectedCustomer?.id]);

  function commitCustomers(nextCustomers) {
    setCustomers(nextCustomers);
    saveCustomers(nextCustomers);
  }

  function updateCustomer(id, patch) {
    commitCustomers(customers.map((customer) => (customer.id === id ? { ...customer, ...patch } : customer)));
  }

  function selectCustomer(id) {
    setSelectedId(id);
    setSelectedWorkflowId('');
    setEditingWorkflowTitleId('');
  }

  function updateWorkflow(workflowId, patch) {
    if (!selectedCustomer) return;
    const timeline = (selectedCustomer.timeline ?? []).map((entry) =>
      entry.id === workflowId ? { ...entry, ...patch } : entry
    );
    updateCustomer(selectedCustomer.id, { timeline });
  }

  function togglePinned(id) {
    commitCustomers(customers.map((customer) => (
      customer.id === id ? { ...customer, pinned: !customer.pinned } : customer
    )));
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
      ...(draft ?? makeArchiveDraft(selectedCustomer)),
      [fieldKey]: value,
    }));
  }

  function updateArchiveFieldLabel(fieldKey, value) {
    setArchiveDraft((draft) => {
      const nextDraft = draft ?? makeArchiveDraft(selectedCustomer);
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
      setArchiveDraft(makeArchiveDraft(selectedCustomer));
      setArchiveEditing(true);
      return;
    }

    if (archiveDraft?.id === selectedCustomer.id) {
      const { id, fieldLabels, ...patch } = archiveDraft;
      patch.fieldLabels = normalizeFieldLabels(fieldLabels);
      updateCustomer(id, patch);
    }
    setArchiveEditing(false);
    setArchiveDraft(null);
  }

  function saveArchiveAsGlobalFields() {
    if (!selectedCustomer || archiveDraft?.id !== selectedCustomer.id) return;

    const { id, fieldLabels, ...patch } = archiveDraft;
    const nextFieldLabels = normalizeFieldLabels(fieldLabels);
    commitCustomers(customers.map((customer) => {
      if (customer.id === id) {
        return { ...customer, ...patch, fieldLabels: nextFieldLabels };
      }
      return { ...customer, fieldLabels: nextFieldLabels };
    }));
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
    setLeftCollapsed((value) => {
      const nextValue = !value;
      saveLayout({ leftCollapsed: nextValue, rightCollapsed });
      return nextValue;
    });
  }

  function toggleRightCollapsed() {
    setRightCollapsed((value) => {
      const nextValue = !value;
      saveLayout({ leftCollapsed, rightCollapsed: nextValue });
      return nextValue;
    });
  }

  function toggleEditorExpanded() {
    const nextExpanded = !editorExpanded;
    setLeftCollapsed(nextExpanded);
    setRightCollapsed(nextExpanded);
    saveLayout({ leftCollapsed: nextExpanded, rightCollapsed: nextExpanded });
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
    setEditingWorkflowTitleId('');
    setNoteTitleDraft('');
  }

  function updateEditorContent(value) {
    if (!selectedCustomer) return;
    if (!selectedWorkflow) {
      updateCustomer(selectedCustomer.id, { messyNotes: value });
      return;
    }

    updateWorkflow(selectedWorkflow.id, { documentContent: value });
  }

  function getEditorHtmlForSave() {
    if (!editorRef.current) return '';
    const clonedEditor = editorRef.current.cloneNode(true);
    clonedEditor.querySelectorAll('.editorImageFrame.active').forEach((element) => {
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

  function makeImageNonDraggable(image) {
    image.draggable = false;
    image.setAttribute('draggable', 'false');
  }

  function prepareImageFrame(frame) {
    frame.contentEditable = 'false';
    frame.draggable = false;
    frame.setAttribute('draggable', 'false');
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
    if (range.collapsed) return;
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
    if (!restoreEditorSelection() || !editorRef.current) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

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

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(frame);
    range.setStartAfter(frame);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
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
    const imageFrame = event.target.closest?.('.editorImageFrame');
    if (imageFrame && editorRef.current?.contains(imageFrame)) {
      clearActiveEditorImage();
      imageFrame.classList.add('active');
      return;
    }
    clearActiveEditorImage();

    const link = event.target.closest?.('a');
    if (!link || !editorRef.current?.contains(link)) return;
    const href = link.getAttribute('href');
    if (!href) return;
    event.preventDefault();
    window.open(normalizeEditorUrl(href), '_blank', 'noopener,noreferrer');
  }

  function handleEditorDragStart(event) {
    const imageFrame = event.target.closest?.('.editorImageFrame');
    if (!imageFrame || !editorRef.current?.contains(imageFrame)) return;

    event.preventDefault();
    clearActiveEditorImage();
    imageFrame.classList.add('active');
  }

  function handleEditorDrop(event) {
    const isInternalImageDrop = event.dataTransfer?.types
      ? Array.from(event.dataTransfer.types).some((type) => type === 'text/html' || type === 'text/uri-list')
      : false;

    if (!isInternalImageDrop) return;

    const html = event.dataTransfer?.getData('text/html') ?? '';
    const uri = event.dataTransfer?.getData('text/uri-list') ?? '';
    if (!html.includes('editorImageFrame') && !html.includes('<img') && !uri.startsWith('data:image/')) return;

    event.preventDefault();
    clearActiveEditorImage();
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
    if (!handle || !editorRef.current?.contains(handle)) return;

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
  }

  function handleEditorKeyDown(event) {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;

    const activeImage = editorRef.current?.querySelector('.editorImageFrame.active');
    if (!activeImage) return;

    event.preventDefault();
    activeImage.remove();
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
          <div className="globalSearch">
            <Search size={17} />
            <span>搜索</span>
          </div>
          <button className="topIconButton" title="提醒">
            <Bell size={19} />
          </button>
          <button className="topIconButton" title="设置">
            <Settings size={19} />
          </button>
        </div>
      </header>

      <section className={`board ${leftCollapsed ? 'leftCollapsed' : ''} ${rightCollapsed ? 'rightCollapsed' : ''}`}>
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
          <div className="customerList">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className={`customerRow ${selectedCustomer?.id === customer.id ? 'selected' : ''} ${customer.pinned ? 'pinned' : ''}`}
                onClick={() => selectCustomer(customer.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') selectCustomer(customer.id);
                }}
                role="button"
                tabIndex={0}
              >
                <BrandLogo company={customer.company} />
                <div className="customerText">
                  <strong>{customer.company || '未命名公司'}</strong>
                  <span>{customer.contact || '未填写联系人'} · {customer.country || '未知国家'}</span>
                </div>
                <div className="customerBadges">
                  <button
                    type="button"
                    className={`pinButton ${customer.pinned ? 'active' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      togglePinned(customer.id);
                    }}
                    title={customer.pinned ? '取消置顶' : '置顶客户'}
                    aria-label={customer.pinned ? `取消置顶 ${customer.company || '未命名客户'}` : `置顶 ${customer.company || '未命名客户'}`}
                  >
                    <Pin size={13} />
                  </button>
                  <button
                    type="button"
                    className="customerDeleteButton"
                    onClick={(event) => {
                      event.stopPropagation();
                      requestDeleteCustomer(customer);
                    }}
                    title="删除用户"
                    aria-label={`删除 ${customer.company || '未命名客户'}`}
                  >
                    <Trash2 size={13} />
                  </button>
                  <GradeBadge grade={customer.grade} />
                </div>
              </div>
            ))}
          </div>
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

        <section className="panel conversationPanel">
          <PanelTitle
            title={selectedCustomerTitle}
            icon={<MessageSquareText size={18} />}
            action={(
              <button className="panelAddButton" onClick={addCustomer}>
                <Plus size={17} />
                添加用户
              </button>
            )}
          />
          {selectedCustomer ? (
            <div className="conversationBody">
              <div className="conversationHero">
                <div className="quickHints">
                  <button onClick={() => setNoteTitleDraft('价格偏好')}><Link size={15} />价格偏好</button>
                  <button onClick={() => setNoteTitleDraft('资料需求')}><File size={15} />资料需求</button>
                  <button onClick={() => setNoteTitleDraft('跟进提醒')}><Bell size={15} />跟进提醒</button>
                  <button onClick={() => setNoteTitleDraft('客户反馈')}><Search size={15} />客户反馈</button>
                  <button onClick={() => setNoteTitleDraft('其他备注')}><Tag size={15} />其他备注</button>
                </div>
              </div>

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
                    swatchClassName="textSwatch"
                    onPick={(color) => applyEditorStyle({ color })}
                  />
                  <EditorColorPicker
                    label="背景色"
                    trigger="□"
                    colors={EDITOR_BACKGROUND_COLORS}
                    swatchClassName="backgroundSwatch"
                    onPick={(backgroundColor) => applyEditorStyle({ backgroundColor })}
                  />
                  <span />
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={() => applyEditorCommand('insertUnorderedList')} title="列表">
                    <List size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={addEditorLink} title="插入链接">
                    <Link size={16} />
                  </button>
                  <button type="button" className="toolbarIconButton" onMouseDown={(event) => event.preventDefault()} onClick={addEditorImage} title="插入图片">
                    <Image size={16} />
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
                  <button
                    type="button"
                    className="toolbarIconButton pushRight"
                    onClick={toggleEditorExpanded}
                    title={editorExpanded ? '恢复两侧栏' : '展开编辑区'}
                    aria-label={editorExpanded ? '恢复两侧栏' : '展开编辑区'}
                  >
                    {editorExpanded ? <Shrink size={16} /> : <Expand size={16} />}
                  </button>
                </div>
                <div
                  key={editorKey}
                  ref={editorRef}
                  className="messyContent"
                  contentEditable={Boolean(selectedCustomer)}
                  suppressContentEditableWarning
                  onInput={syncEditorContent}
                  onMouseDown={handleEditorMouseDown}
                  onMouseUp={saveEditorSelection}
                  onKeyDown={handleEditorKeyDown}
                  onKeyUp={saveEditorSelection}
                  onFocus={saveEditorSelection}
                  onClick={handleEditorClick}
                  onDragStart={handleEditorDragStart}
                  onDrop={handleEditorDrop}
                  onWheel={handleEditorWheel}
                  data-placeholder={selectedWorkflow ? '编辑当前工作流对应的文档内容。' : '请先添加或选择一个工作流。'}
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
                <button onClick={addMessyNote}>
                  <Send size={19} />
                </button>
              </div>
            </div>
          ) : (
            <EmptyState text="暂无用户，请先添加一个用户。" />
          )}
        </section>

        <aside className={`panel studioPanel ${rightCollapsed ? 'collapsedPanel' : ''}`}>
          <PanelTitle
            title="用户档案"
            icon={<FileText size={18} />}
            meta={selectedCustomer ? `${activeWorkflowCount} 个活跃工作流` : ''}
            collapsed={rightCollapsed}
            onToggle={toggleRightCollapsed}
            toggleTitle={rightCollapsed ? '展开用户档案' : '收起用户档案'}
            toggleIcon={rightCollapsed ? <ChevronsLeft size={17} /> : <ChevronsRight size={17} />}
          />
          {rightCollapsed ? (
            <CollapsedWorkflowRail
              workflows={selectedCustomer?.timeline ?? []}
              selectedWorkflowId={selectedWorkflow?.id}
              onSelect={setSelectedWorkflowId}
            />
          ) : selectedCustomer ? (
            <div className="archiveScroll">
              <div className="archiveCard">
                <div className="archiveHero">
                  <BrandLogo company={archiveCustomer.company} large />
                  <div className="archiveIdentity">
                    <div className="archiveNameLine">
                      <input
                        style={{ width: `${Math.max((archiveCustomer.company || '未命名公司').length + 1, 4)}em` }}
                        value={archiveCustomer.company ?? ''}
                        onChange={(event) => updateArchiveDraft('company', event.target.value)}
                        disabled={!archiveEditing}
                        placeholder="未命名公司"
                      />
                      <GradeBadge grade={archiveCustomer.grade} compact />
                    </div>
                    <span>{gradeMap[archiveCustomer.grade] ? `${gradeMap[archiveCustomer.grade]} · ` : ''}{archiveCustomer.country || '未填写国家'}</span>
                  </div>
                  <div className="archiveEditActions">
                    {archiveEditing && (
                      <button className="archiveGlobalSaveButton" onClick={saveArchiveAsGlobalFields}>
                        全局保存参数名
                      </button>
                    )}
                    <button className={`archiveEditButton ${archiveEditing ? 'savingMode' : ''}`} onClick={toggleArchiveEditing}>
                      {archiveEditing ? '保存当前客户' : '编辑档案'}
                    </button>
                  </div>
                </div>

                <div className="archiveInfoGrid">
                  {archiveFields.map(([key, label]) => (
                    <ArchiveField
                      key={key}
                      label={getArchiveFieldLabel(archiveCustomer, key, label)}
                      defaultLabel={label}
                      fieldKey={key}
                      archiveCustomer={archiveCustomer}
                      editing={archiveEditing}
                      updateArchiveDraft={updateArchiveDraft}
                      updateArchiveFieldLabel={updateArchiveFieldLabel}
                    />
                  ))}
                </div>

                <div className="archiveWorkflowBlock">
                  <div className="archiveWorkflowHeader">
                    <h3>最近工作流</h3>
                    <div className="archiveWorkflowActions">
                      <button
                        className="archiveDeleteWorkflowButton"
                        onClick={() => selectedWorkflow && deleteWorkflow(selectedWorkflow.id)}
                        disabled={!selectedWorkflow}
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </div>

                  <div className={`archiveTimeline ${(selectedCustomer.timeline ?? []).length === 0 ? 'emptyTimeline' : ''}`}>
                  {(selectedCustomer.timeline ?? []).map((item) => {
                    const editingTitle = editingWorkflowTitleId === item.id;

                    return (
                      <div
                        className={`archiveTimelineRow ${selectedWorkflow?.id === item.id ? 'selectedWorkflow' : ''}`}
                        key={item.id}
                        onClick={() => setSelectedWorkflowId(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') setSelectedWorkflowId(item.id);
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
                            onFocus={() => setSelectedWorkflowId(item.id)}
                            onClick={(event) => event.stopPropagation()}
                            onDoubleClick={(event) => {
                              event.stopPropagation();
                              setSelectedWorkflowId(item.id);
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
                            type="radio"
                            name="selectedWorkflow"
                            checked={selectedWorkflow?.id === item.id}
                            onChange={() => setSelectedWorkflowId(item.id)}
                            aria-label={`选择 ${item.title ?? item.content ?? '工作流'}`}
                          />
                          <span />
                        </label>
                        <div className="workflowControls">
                          <select
                            value={item.status}
                            className={`statusSelect status${item.status}`}
                            onFocus={() => setSelectedWorkflowId(item.id)}
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

function EditorColorPicker({ label, trigger, colors, swatchClassName, onPick }) {
  return (
    <div className="toolbarColorPicker" title={label}>
      <button
        type="button"
        className={`toolbarColorTrigger ${swatchClassName}`}
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

function ArchiveField({ label, defaultLabel, fieldKey, archiveCustomer, editing, updateArchiveDraft, updateArchiveFieldLabel }) {
  const isGrade = fieldKey === 'grade';
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
            {archiveCustomer.fieldLabels?.[fieldKey] ?? label}
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
      ) : (
        <input
          value={archiveCustomer[fieldKey] ?? ''}
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

export default App;
