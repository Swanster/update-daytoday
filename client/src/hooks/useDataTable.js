/**
 * useDataTable - Custom hook for table data operations
 * Handles search, sort, selection, and filtering for table data
 */
import { useState, useMemo, useCallback } from 'react';

export function useDataTable(data, options = {}) {
    const { searchFields = [], defaultSort = 'sequence' } = options;
    
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState(defaultSort);
    const [selectedIds, setSelectedIds] = useState([]);

    // Filter data by search term
    const filteredData = useMemo(() => {
        let result = [...data];

        // Filter by search term
        if (searchTerm.trim() && searchFields.length > 0) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item => {
                return searchFields.some(field => {
                    const value = item[field];
                    if (Array.isArray(value)) {
                        return value.some(v => 
                            typeof v === 'string' && v.toLowerCase().includes(term)
                        );
                    }
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(term);
                    }
                    return false;
                });
            });
        }

        return result;
    }, [data, searchTerm, searchFields]);

    // Sort data
    const sortedData = useMemo(() => {
        const result = [...filteredData];
        
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.projectName || a.clientName || '').localeCompare(
                        b.projectName || b.clientName || ''
                    );
                case 'date':
                    return new Date(b.date || b.createdAt || 0) - 
                           new Date(a.date || a.createdAt || 0);
                case 'status':
                    return (a.status || '').localeCompare(b.status || '');
                case 'sequence':
                default:
                    return (a.quarterSequence || 0) - (b.quarterSequence || 0);
            }
        });

        return result;
    }, [filteredData, sortBy]);

    // Toggle selection of an item
    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            return [...prev, id];
        });
    }, []);

    // Toggle all items
    const toggleAll = useCallback((allIds) => {
        setSelectedIds(prev => {
            if (prev.length === allIds.length) {
                return [];
            }
            return [...allIds];
        });
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    // Check if item is selected
    const isSelected = useCallback((id) => {
        return selectedIds.includes(id);
    }, [selectedIds]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    return {
        // Data
        data: sortedData,
        totalCount: data.length,
        filteredCount: sortedData.length,
        
        // Search
        searchTerm,
        setSearchTerm,
        clearSearch,
        
        // Sort
        sortBy,
        setSortBy,
        
        // Selection
        selectedIds,
        setSelectedIds,
        toggleSelection,
        toggleAll,
        clearSelection,
        isSelected,
        selectedCount: selectedIds.length
    };
}

export default useDataTable;
