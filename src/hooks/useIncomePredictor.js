import { useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";

/**
  * Custom React hook to calculate paychecks and expected income for arbitrary months/years.
  * Correctly supports:
  *   - 'semi-monthly' schedules (specific days clamped to max days in month).
  *   - 'bi-weekly' schedules (recurs every 14 days, anchored at anchorDate).
  */
export default function useIncomePredictor() {
  const { incomeStreams } = useApp();

  /**
   * Computes the total expected monetary income for a given month and year.
   * @param {number} month - 0-indexed calendar month (0 = Jan, 11 = Dec)
   * @param {number} year - Full calendar year (e.g. 2026)
   * @returns {number} Expected income sum
   */
  const getIncomeForMonth = useMemo(() => {
    return (month, year) => {
      let totalExpected = 0;
      
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      startOfMonth.setHours(0, 0, 0, 0);
      
      const totalDays = endOfMonth.getDate();

      incomeStreams.forEach((stream) => {
        const amount = parseFloat(stream.amount) || 0;
        
        if (stream.type === "semi-monthly") {
          // Specific pay dates of the month (e.g., [7, 22])
          const paydaysCount = Array.isArray(stream.dates) ? stream.dates.length : 0;
          totalExpected += paydaysCount * amount;
          
        } else if (stream.type === "bi-weekly") {
          // Recurring bi-weekly cycle anchored at a specific paycheck date
          if (!stream.anchorDate) return;
          
          const anchor = new Date(stream.anchorDate + "T00:00:00");
          anchor.setHours(0, 0, 0, 0);
          
          // Calculate difference in days between start of the target month and the anchor
          const diffMs = startOfMonth.getTime() - anchor.getTime();
          const diffDays = Math.round(diffMs / 86400000);
          
          // Index of the first paycheck on or after the start of the month
          let k = Math.ceil(diffDays / 14);
          
          let paydaysCount = 0;
          let currentPayday = new Date(anchor.getTime() + k * 14 * 86400000);
          currentPayday.setHours(0, 0, 0, 0);

          while (currentPayday <= endOfMonth) {
            if (currentPayday >= startOfMonth) {
              paydaysCount++;
            }
            currentPayday = new Date(currentPayday.getTime() + 14 * 86400000);
            currentPayday.setHours(0, 0, 0, 0);
          }
          
          totalExpected += paydaysCount * amount;
        }
      });
      
      return totalExpected;
    };
  }, [incomeStreams]);

  /**
   * Generates a chronologically sorted array of individual paycheck events hitting the month.
   * Useful for auditing, checkbook envelopes display, and ledger entries.
   */
  const getPaydayDetailsForMonth = useMemo(() => {
    return (month, year) => {
      const details = [];
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      startOfMonth.setHours(0, 0, 0, 0);
      
      const totalDays = endOfMonth.getDate();

      incomeStreams.forEach((stream) => {
        const amount = parseFloat(stream.amount) || 0;
        
        if (stream.type === "semi-monthly") {
          const dates = Array.isArray(stream.dates) ? stream.dates : [];
          dates.forEach((d) => {
            const dayNum = parseInt(d) || 15;
            // Clamp paydate to maximum calendar days in target month
            const clampedDay = Math.min(dayNum, totalDays);
            const paydayDate = new Date(year, month, clampedDay);
            details.push({
              id: `${stream.id}-${clampedDay}`,
              name: stream.name,
              amount,
              type: "semi-monthly",
              date: paydayDate,
              dayLabel: `${clampedDay}th`
            });
          });
        } else if (stream.type === "bi-weekly") {
          if (!stream.anchorDate) return;
          const anchor = new Date(stream.anchorDate + "T00:00:00");
          anchor.setHours(0, 0, 0, 0);
          
          const diffMs = startOfMonth.getTime() - anchor.getTime();
          const diffDays = Math.round(diffMs / 86400000);
          
          let k = Math.ceil(diffDays / 14);
          
          let currentPayday = new Date(anchor.getTime() + k * 14 * 86400000);
          currentPayday.setHours(0, 0, 0, 0);

          while (currentPayday <= endOfMonth) {
            if (currentPayday >= startOfMonth) {
              details.push({
                id: `${stream.id}-${currentPayday.getTime()}`,
                name: stream.name,
                amount,
                type: "bi-weekly",
                date: new Date(currentPayday),
                dayLabel: currentPayday.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              });
            }
            currentPayday = new Date(currentPayday.getTime() + 14 * 86400000);
            currentPayday.setHours(0, 0, 0, 0);
          }
        }
      });
      
      // Sort chronologically
      details.sort((a, b) => a.date - b.date);
      return details;
    };
  }, [incomeStreams]);

  /**
   * Checks if any bi-weekly stream in this month qualifies as a "3-paycheck bonus month".
   */
  const checkIsBonusMonth = useMemo(() => {
    return (month, year) => {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      startOfMonth.setHours(0, 0, 0, 0);
      
      let hasBonus = false;

      incomeStreams.forEach((stream) => {
        if (stream.type !== "bi-weekly" || !stream.anchorDate) return;
        
        const anchor = new Date(stream.anchorDate + "T00:00:00");
        anchor.setHours(0, 0, 0, 0);
        
        const diffMs = startOfMonth.getTime() - anchor.getTime();
        const diffDays = Math.round(diffMs / 86400000);
        
        let k = Math.ceil(diffDays / 14);
        
        let count = 0;
        let currentPayday = new Date(anchor.getTime() + k * 14 * 86400000);
        currentPayday.setHours(0, 0, 0, 0);

        while (currentPayday <= endOfMonth) {
          if (currentPayday >= startOfMonth) {
            count++;
          }
          currentPayday = new Date(currentPayday.getTime() + 14 * 86400000);
          currentPayday.setHours(0, 0, 0, 0);
        }
        
        if (count >= 3) {
          hasBonus = true;
        }
      });

      return hasBonus;
    };
  }, [incomeStreams]);

  return {
    incomeStreams,
    getIncomeForMonth,
    getPaydayDetailsForMonth,
    checkIsBonusMonth
  };
}
