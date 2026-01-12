/**
 * useQuarters - Custom hook for quarter selection logic
 * Handles current quarter calculation and quarter state management
 */
import { useState, useEffect, useCallback } from 'react';

export function useQuarters() {
    const [quarters, setQuarters] = useState([]);
    const [selectedQuarter, setSelectedQuarter] = useState(null);

    // Get current quarter
    const getCurrentQuarter = useCallback(() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const quarter = Math.floor(month / 3) + 1;
        return { quarter: `Q${quarter}-${year}`, year };
    }, []);

    // Get previous quarter
    const getPreviousQuarter = useCallback((currentQuarter, currentYear) => {
        if (!currentQuarter) return null;
        const qNum = parseInt(currentQuarter.charAt(1));
        if (qNum === 1) {
            return { quarter: `Q4-${currentYear - 1}`, year: currentYear - 1 };
        }
        return { quarter: `Q${qNum - 1}-${currentYear}`, year: currentYear };
    }, []);

    // Initialize with current quarter
    useEffect(() => {
        if (!selectedQuarter) {
            setSelectedQuarter(getCurrentQuarter());
        }
    }, [getCurrentQuarter, selectedQuarter]);

    // Handle quarter change from select
    const handleQuarterChange = useCallback((e) => {
        const value = e.target.value;
        const [quarter, year] = value.split('|');
        setSelectedQuarter({ quarter, year: parseInt(year) });
    }, []);

    // Update quarters list
    const updateQuarters = useCallback((data) => {
        // Filter out any invalid quarters
        let filtered = data.filter(q => q.quarter && q.year);
        
        // Ensure current quarter is present
        const current = getCurrentQuarter();
        if (!filtered.find(q => q.quarter === current.quarter)) {
            filtered.unshift(current);
        }
        
        setQuarters(filtered);
    }, [getCurrentQuarter]);

    // Get select value string
    const getSelectValue = useCallback(() => {
        if (!selectedQuarter) return '';
        return `${selectedQuarter.quarter}|${selectedQuarter.year}`;
    }, [selectedQuarter]);

    return {
        quarters,
        selectedQuarter,
        setSelectedQuarter,
        getCurrentQuarter,
        getPreviousQuarter,
        handleQuarterChange,
        updateQuarters,
        getSelectValue
    };
}

export default useQuarters;
