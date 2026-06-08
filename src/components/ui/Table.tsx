import { useState, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Search,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatInteger } from '../../utils/format';

type SortDirection = 'asc' | 'desc';

interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: T[keyof T] | undefined, row: T, index: number) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selected: T[]) => void;
  pagination?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  placeholder?: string;
  onRowClick?: (row: T, index: number) => void;
  emptyText?: string;
  className?: string;
}

function TableHeader<T>({
  columns,
  sortField,
  sortDirection,
  onSort,
  selectable,
  allSelected,
  someSelected,
  onSelectAll,
}: {
  columns: Column<T>[];
  sortField: string | null;
  sortDirection: SortDirection | null;
  onSort: (key: string) => void;
  selectable?: boolean;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: () => void;
}) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        {selectable && (
          <th className="px-4 py-3 w-12">
            <button
              onClick={onSelectAll}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-green-600" />
              ) : someSelected ? (
                <CheckSquare className="w-4 h-4 text-green-600 opacity-50" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </th>
        )}
        {columns.map((column) => {
          const isSorted = sortField === column.key;
          const alignClass = column.align === 'center'
            ? 'text-center'
            : column.align === 'right'
            ? 'text-right'
            : 'text-left';

          return (
            <th
              key={String(column.key)}
              style={{ width: column.width }}
              className={cn(
                'px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider',
                alignClass,
                column.sortable && 'cursor-pointer hover:bg-gray-100 select-none'
              )}
              onClick={() => column.sortable && onSort(String(column.key))}
            >
              <div
                className={cn(
                  'inline-flex items-center gap-1',
                  column.align === 'center' && 'justify-center w-full',
                  column.align === 'right' && 'justify-end w-full'
                )}
              >
                {column.title}
                {column.sortable && (
                  <span className="inline-flex flex-col ml-1">
                    {isSorted ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-green-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-green-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    )}
                  </span>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function TableBody<T>({
  columns,
  data,
  rowKey,
  loading,
  selectable,
  selectedRows,
  onRowSelect,
  onRowClick,
  emptyText,
}: {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  loading: boolean;
  selectable?: boolean;
  selectedRows: T[];
  onRowSelect: (row: T) => void;
  onRowClick?: (row: T, index: number) => void;
  emptyText: string;
}) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length + (selectable ? 1 : 0)}
            className="px-4 py-16 text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              <p className="text-gray-500">加载中...</p>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length + (selectable ? 1 : 0)}
            className="px-4 py-16 text-center"
          >
            <p className="text-gray-500">{emptyText}</p>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-gray-100">
      {data.map((row, rowIndex) => {
        const key = typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey as keyof T]);
        const isSelected = selectedRows.some((r) => JSON.stringify(r) === JSON.stringify(row));

        return (
          <motion.tr
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rowIndex * 0.02 }}
            className={cn(
              'hover:bg-gray-50 transition-colors',
              onRowClick && 'cursor-pointer',
              isSelected && 'bg-green-50'
            )}
            onClick={() => onRowClick?.(row, rowIndex)}
          >
            {selectable && (
              <td className="px-4 py-3 w-12">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowSelect(row);
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-green-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </td>
            )}
            {columns.map((column) => {
              const value = row[column.key as keyof T];
              const alignClass = column.align === 'center'
                ? 'text-center'
                : column.align === 'right'
                ? 'text-right'
                : 'text-left';

              return (
                <td
                  key={String(column.key)}
                  className={cn('px-4 py-3 text-sm text-gray-700', alignClass)}
                >
                  {column.render ? column.render(value, row, rowIndex) : String(value ?? '-')}
                </td>
              );
            })}
          </motion.tr>
        );
      })}
    </tbody>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions: number[];
}) {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          显示 {formatInteger(startItem)} - {formatInteger(endItem)} 条，共 {formatInteger(total)} 条
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} 条/页
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                  page === pageNum
                    ? 'bg-green-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  pagination = true,
  total,
  page: initialPage = 1,
  pageSize: initialPageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  searchable = false,
  searchKeys,
  placeholder = '搜索...',
  onRowClick,
  emptyText = '暂无数据',
  className,
}: TableProps<T>) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedRows, setLocalSelectedRows] = useState<T[]>(selectedRows);

  const actualSelectedRows = onSelectionChange ? selectedRows : localSelectedRows;

  const filteredData = useMemo(() => {
  let result = [...data];

  if (searchable && searchQuery && searchKeys) {
    const query = searchQuery.toLowerCase();
    result = result.filter((row) =>
      searchKeys.some((key) => {
        const value = row[key];
        return String(value ?? '').toLowerCase().includes(query);
      })
    );
  }

  if (sortField && sortDirection) {
    result.sort((a, b) => {
      const aVal = a[sortField as keyof T];
      const bVal = b[sortField as keyof T];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }

  return result;
}, [data, sortField, sortDirection, searchQuery, searchable, searchKeys]);

  const actualTotal = pagination && total !== undefined ? total : filteredData.length;

  const paginatedData = useMemo(() => {
  if (!pagination) return filteredData;
  const start = (page - 1) * pageSize;
  return filteredData.slice(start, start + pageSize);
}, [filteredData, page, pageSize, pagination]);

  const handleSort = (key: string) => {
    if (sortField === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    const allSelected = actualSelectedRows.length === paginatedData.length;
    const newSelected = allSelected
      ? actualSelectedRows.filter((r) =>
          !paginatedData.some((pr) => JSON.stringify(pr) === JSON.stringify(r))
        )
      : [...new Set([...actualSelectedRows, ...paginatedData])];
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    } else {
      setLocalSelectedRows(newSelected);
    }
  };

  const handleRowSelect = (row: T) => {
    const isSelected = actualSelectedRows.some(
      (r) => JSON.stringify(r) === JSON.stringify(row)
    );
    const newSelected = isSelected
      ? actualSelectedRows.filter(
          (r) => JSON.stringify(r) !== JSON.stringify(row)
        )
      : [...actualSelectedRows, row];
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    } else {
      setLocalSelectedRows(newSelected);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    onPageChange?.(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    onPageSizeChange?.(newSize);
  };

  const allSelected = paginatedData.length > 0
    ? actualSelectedRows.length === paginatedData.length
    : false;
  const someSelected = actualSelectedRows.length > 0 && !allSelected;

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 overflow-hidden', className)}>
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={placeholder}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader
            columns={columns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            selectable={selectable}
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={handleSelectAll}
          />
          <TableBody
            columns={columns}
            data={paginatedData}
            rowKey={rowKey}
            loading={loading}
            selectable={selectable}
            selectedRows={actualSelectedRows}
            onRowSelect={handleRowSelect}
            onRowClick={onRowClick}
            emptyText={emptyText}
          />
        </table>
      </div>
      {pagination && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={actualTotal}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
