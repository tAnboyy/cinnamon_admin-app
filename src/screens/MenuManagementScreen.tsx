import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  updateMenuItem,
} from '../services/api';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  type: string;
}

const EMPTY_FORM = { name: '', price: '', description: '', image: '', category: '', type: '' };
const CATEGORIES = ['Appetizer', 'Soup', 'Paneer', 'Chicken', 'Rice', 'Bread', 'Biryani', 'Dessert', 'Drink', 'Side', 'Other'];
const TYPES = ['menu', 'catering'];

type ActiveFilter = 'category' | 'type' | 'price' | null;

export default function MenuManagementScreen() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');

  // Measure header cell positions for popover placement
  const [colLayouts, setColLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const tableRef = useRef<View>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMenuItems();
      setItems(data as MenuItem[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditingItem(null); setForm(EMPTY_FORM); setModalVisible(true); };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name ?? '',
      price: item.price != null ? String(item.price) : '',
      description: item.description ?? '',
      image: item.image ?? '',
      category: item.category ?? '',
      type: item.type ?? '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Validation', 'Name is required.'); return; }
    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) { Alert.alert('Validation', 'Enter a valid price.'); return; }
    const payload = {
      name: form.name.trim(), price: parsedPrice,
      description: form.description.trim(), image: form.image.trim(),
      category: form.category.trim(), type: form.type.trim(),
    };
    setSaving(true);
    try {
      if (editingItem) {
        const updated = await updateMenuItem(editingItem.id, payload);
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...updated, id: editingItem.id } : i));
      } else {
        const created = await createMenuItem(payload);
        setItems(prev => [...prev, created as MenuItem]);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: MenuItem) => {
    const doDelete = () =>
      deleteMenuItem(item.id)
        .then(() => setItems(prev => prev.filter(i => i.id !== item.id)))
        .catch((e: any) => Alert.alert('Error', e.message));
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`Delete "${item.name}"?`)) doDelete();
    } else {
      Alert.alert('Delete', `Delete "${item.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const minPrice = filterPriceMin !== '' ? parseFloat(filterPriceMin) : null;
  const maxPrice = filterPriceMax !== '' ? parseFloat(filterPriceMax) : null;
  const hasFilters = !!(filterCategory.length || filterType.length || filterPriceMin || filterPriceMax);

  const filtered = items.filter(i => {
    if (search && !(
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.toLowerCase().includes(search.toLowerCase()) ||
      i.type?.toLowerCase().includes(search.toLowerCase())
    )) return false;
    if (filterCategory.length && !filterCategory.includes(i.category)) return false;
    if (filterType.length && !filterType.includes(i.type)) return false;
    const p = Number(i.price ?? 0);
    if (minPrice !== null && !isNaN(minPrice) && p < minPrice) return false;
    if (maxPrice !== null && !isNaN(maxPrice) && p > maxPrice) return false;
    return true;
  });

  const toggleFilter = (col: ActiveFilter) =>
    setActiveFilter(prev => prev === col ? null : col);

  const measureCol = (col: string) => (e: any) => {
    const { x, width } = e.nativeEvent.layout;
    setColLayouts(prev => ({ ...prev, [col]: { x, width } }));
  };

  const popoverLeft = (col: string) => {
    const layout = colLayouts[col];
    if (!layout) return 0;
    return layout.x;
  };

  const toggleCategory = (c: string) =>
    setFilterCategory(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const toggleType = (t: string) =>
    setFilterType(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <View style={styles.container}>
      {/* Search + Add */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, category or type…"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#c0392b" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tableWrap} ref={tableRef}>

          {/* Dismiss popover on outside tap */}
          {activeFilter && (
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setActiveFilter(null)} />
          )}

          {/* Table header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.col, styles.colNum, styles.thText]}>#</Text>
            <Text style={[styles.col, styles.colName, styles.thText]}>Name</Text>

            {/* Category header */}
            <TouchableOpacity
              style={[styles.col, styles.colCategory, styles.thCell]}
              onLayout={measureCol('category')}
              onPress={() => toggleFilter('category')}
            >
              <Text style={[styles.thText, filterCategory.length ? styles.thTextActive : null]}>Category</Text>
              <FilterIcon active={activeFilter === 'category'} hasValue={filterCategory.length > 0} />
            </TouchableOpacity>

            {/* Type header */}
            <TouchableOpacity
              style={[styles.col, styles.colType, styles.thCell]}
              onLayout={measureCol('type')}
              onPress={() => toggleFilter('type')}
            >
              <Text style={[styles.thText, filterType.length ? styles.thTextActive : null]}>Type</Text>
              <FilterIcon active={activeFilter === 'type'} hasValue={filterType.length > 0} />
            </TouchableOpacity>

            {/* Price header */}
            <TouchableOpacity
              style={[styles.col, styles.colPrice, styles.thCell]}
              onLayout={measureCol('price')}
              onPress={() => toggleFilter('price')}
            >
              <Text style={[styles.thText, (filterPriceMin || filterPriceMax) ? styles.thTextActive : null]}>Price</Text>
              <FilterIcon active={activeFilter === 'price'} hasValue={!!(filterPriceMin || filterPriceMax)} />
            </TouchableOpacity>

            <Text style={[styles.col, styles.colActions, styles.thText]}>Actions</Text>
          </View>

          {/* ── Popovers ── rendered in the same layer as the header so they float over rows */}

          {activeFilter === 'category' && (
            <View style={[styles.popover, { left: popoverLeft('category') }]}>
              <Text style={styles.popoverTitle}>Filter by Category</Text>
              <View style={styles.popoverChips}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.filterChip, filterCategory.includes(c) && styles.filterChipActive]}
                    onPress={() => toggleCategory(c)}
                  >
                    <Text style={[styles.filterChipText, filterCategory.includes(c) && styles.filterChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {filterCategory.length > 0 && (
                <TouchableOpacity onPress={() => setFilterCategory([])}>
                  <Text style={styles.popoverClear}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeFilter === 'type' && (
            <View style={[styles.popover, { left: popoverLeft('type') }]}>
              <Text style={styles.popoverTitle}>Filter by Type</Text>
              <View style={styles.popoverChips}>
                {TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.filterChip, filterType.includes(t) && styles.filterChipActive]}
                    onPress={() => toggleType(t)}
                  >
                    <Text style={[styles.filterChipText, filterType.includes(t) && styles.filterChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {filterType.length > 0 && (
                <TouchableOpacity onPress={() => setFilterType([])}>
                  <Text style={styles.popoverClear}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeFilter === 'price' && (
            <View style={[styles.popover, { left: popoverLeft('price') }]}>
              <Text style={styles.popoverTitle}>Filter by Price</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min $"
                  value={filterPriceMin}
                  onChangeText={setFilterPriceMin}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#bbb"
                />
                <Text style={styles.priceSep}>–</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max $"
                  value={filterPriceMax}
                  onChangeText={setFilterPriceMax}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#bbb"
                />
              </View>
              {(filterPriceMin || filterPriceMax) && (
                <TouchableOpacity onPress={() => { setFilterPriceMin(''); setFilterPriceMax(''); setActiveFilter(null); }}>
                  <Text style={styles.popoverClear}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Status bar */}
          <View style={styles.statusBar}>
            <Text style={styles.countText}>
              {(search || hasFilters) ? `${filtered.length} of ${items.length}` : `${items.length}`} item{items.length !== 1 ? 's' : ''}
            </Text>
            {hasFilters && (
              <TouchableOpacity onPress={() => { setFilterCategory([]); setFilterType([]); setFilterPriceMin(''); setFilterPriceMax(''); }}>
                <Text style={styles.clearAllText}>Clear all filters</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Table rows */}
          <ScrollView>
            {filtered.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {(search || hasFilters) ? 'No items match your filters.' : 'No menu items yet.'}
                </Text>
              </View>
            ) : (
              filtered.map((item, idx) => (
                <View key={item.id} style={[styles.row, idx % 2 === 1 && styles.rowAlt]}>
                  <Text style={[styles.col, styles.colNum, styles.rowNum]}>{idx + 1}</Text>
                  <View style={[styles.col, styles.colName]}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    {!!item.description && <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>}
                  </View>
                  <View style={[styles.col, styles.colCategory]}>
                    {item.category
                      ? <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
                      : <Text style={styles.dimText}>—</Text>}
                  </View>
                  <View style={[styles.col, styles.colType]}>
                    {item.type
                      ? <View style={[styles.badge, styles.typeBadge]}><Text style={[styles.badgeText, styles.typeBadgeText]}>{item.type}</Text></View>
                      : <Text style={styles.dimText}>—</Text>}
                  </View>
                  <Text style={[styles.col, styles.colPrice, styles.priceText]}>
                    ${Number(item.price ?? 0).toFixed(2)}
                  </Text>
                  <View style={[styles.col, styles.colActions, styles.actionsRow]}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'New Item'}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <FormField label="Name *" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Butter Chicken" />
              <FormField label="Price *" value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))} placeholder="e.g. 14.99" keyboardType="decimal-pad" />
              <FormField label="Description" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Short description" multiline />
              <FormField label="Image URL" value={form.image} onChangeText={v => setForm(f => ({ ...f, image: v }))} placeholder="https://…" />
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipSelected]}
                    onPress={() => setForm(f => ({ ...f, category: f.category === c ? '' : c }))}>
                    <Text style={[styles.chipText, form.category === c && styles.chipTextSelected]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.chipRow}>
                {TYPES.map(t => (
                  <TouchableOpacity key={t} style={[styles.chip, form.type === t && styles.chipSelected]}
                    onPress={() => setForm(f => ({ ...f, type: f.type === t ? '' : t }))}>
                    <Text style={[styles.chipText, form.type === t && styles.chipTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editingItem ? 'Save Changes' : 'Create'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FilterIcon({ active, hasValue }: { active: boolean; hasValue: boolean }) {
  return (
    <View style={[styles.filterIconWrap, (active || hasValue) && styles.filterIconWrapActive]}>
      {/* Funnel shape: wide bar → narrow bar → dot */}
      <View style={[styles.fi1, hasValue && styles.fiActive]} />
      <View style={[styles.fi2, hasValue && styles.fiActive]} />
      <View style={[styles.fi3, hasValue && styles.fiActive]} />
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, multiline }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'decimal-pad'; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor="#bbb" keyboardType={keyboardType ?? 'default'}
        multiline={multiline} numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
  },
  addBtn: { backgroundColor: '#c0392b', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, flexShrink: 0 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  searchInput: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 8,
    borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111',
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { color: '#c0392b', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: { backgroundColor: '#c0392b', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },

  tableWrap: { flex: 1 },

  tableHeader: {
    flexDirection: 'row', backgroundColor: '#2c2c2c',
    paddingHorizontal: 12, alignItems: 'center',
  },
  thCell: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 11 },
  thText: { color: '#fff', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  thTextActive: { color: '#f5a623' },

  // Funnel icon (three stacked lines getting shorter)
  filterIconWrap: {
    width: 14, height: 12, justifyContent: 'space-between', alignItems: 'center',
    opacity: 0.5,
  },
  filterIconWrapActive: { opacity: 1 },
  fi1: { width: 12, height: 2, borderRadius: 1, backgroundColor: '#ccc' },
  fi2: { width: 8,  height: 2, borderRadius: 1, backgroundColor: '#ccc' },
  fi3: { width: 4,  height: 2, borderRadius: 1, backgroundColor: '#ccc' },
  fiActive: { backgroundColor: '#f5a623' },

  // Floating popover
  popover: {
    position: 'absolute',
    top: 42, // header height
    zIndex: 100,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    width: 260,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  popoverTitle: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  popoverChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  popoverClear: { marginTop: 10, fontSize: 12, color: '#c0392b', fontWeight: '600' },

  filterChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5',
  },
  filterChipActive: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  filterChipText: { fontSize: 12, color: '#555' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceInput: {
    flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, color: '#111', backgroundColor: '#fafafa',
  },
  priceSep: { color: '#aaa', fontSize: 14, flexShrink: 0 },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f7f7f7',
  },
  countText: { fontSize: 12, color: '#888' },
  clearAllText: { fontSize: 12, color: '#c0392b', fontWeight: '600' },

  row: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center',
  },
  rowAlt: { backgroundColor: '#fafafa' },

  col: { paddingHorizontal: 4 },
  colNum: { width: 36 },
  colName: { flex: 3 },
  colCategory: { flex: 2 },
  colType: { flex: 2 },
  colPrice: { flex: 1 },
  colActions: { flex: 2 },
  rowNum: { fontSize: 12, color: '#aaa', textAlign: 'center' },

  itemName: { fontSize: 14, fontWeight: '600', color: '#111' },
  itemDesc: { fontSize: 11, color: '#888', marginTop: 2 },

  badge: { backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, color: '#2e7d32', fontWeight: '600' },
  typeBadge: { backgroundColor: '#e3f2fd' },
  typeBadgeText: { color: '#1565c0' },
  dimText: { color: '#bbb', fontSize: 13 },
  priceText: { fontSize: 14, fontWeight: '600', color: '#333' },

  actionsRow: { flexDirection: 'row', gap: 6 },
  editBtn: { backgroundColor: '#1565c0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#c0392b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  deleteBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  emptyRow: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modal: {
    backgroundColor: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90%',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  closeBtn: { fontSize: 18, color: '#888', paddingHorizontal: 4 },
  modalBody: { padding: 16 },
  modalFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 10,
    padding: 16, borderTopWidth: 1, borderTopColor: '#eee',
  },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111', backgroundColor: '#fafafa',
  },
  fieldInputMulti: { minHeight: 72, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5' },
  chipSelected: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  chipText: { fontSize: 12, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: '#fff' },

  cancelBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  cancelBtnText: { fontSize: 14, color: '#555', fontWeight: '600' },
  saveBtn: { backgroundColor: '#c0392b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, minWidth: 110, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
