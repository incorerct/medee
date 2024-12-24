
  const handleExportToExcel_illeg = async () => {
    if (isLoadingData) {
      console.log("Data is still loading. Please wait...");
      return;
    }
  
    setIsLoadingData(true);
  
    try {
      await fetchSavedData_illeg();
  
      // Check if data length is greater than zero before proceeding with export
      if (!savedData_illeg || Object.keys(savedData_illeg).length === 0) {
        console.log("No data available to export.");
        alert("Мэдээлэл авахад алдаа гарлаа, түр хүлээгээд ахин оролдоно уу.");
        return; // Don't proceed if no data is available
      }
  
      // Proceed with generating the Excel file
      const workbook = XLSX.utils.book_new();
      const worksheetData = [];
  
      // Calculate the number of days between startDate and endDate
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffInTime = end.getTime() - start.getTime();
      const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24)) + 1; // Convert milliseconds to days and add 1
  
      const dateRange = Array.from({ length: diffInDays }, (_, i) => {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + i); // Increment by one day
        return nextDate.toISOString().split("T")[0];
      });
  
       worksheetData.push(["Ангилал", "Сонголт", ...dateRange, "Нийт Өвчтөн", "Нийт Эмчилгээ"]);// Added "Төсөв" column for the sum after `#`

    // Fill in Data for all categories and options
    categories_illeg.forEach((category) => {
      const options = category.options;

      options.forEach((option) => {
        const row = [
          category.name, // Category Name
          option, // Option Name
          ...dateRange.map((date) => {
            const matchingData = savedData_illeg[category.name.toLowerCase()]?.[option]?.find(
              (entry) => entry.date === date
            );
            return matchingData ? matchingData.value : ""; // Empty string for no data
          }),
        ];

        // Calculate the original total for the row
        const total = row.slice(2).reduce((sum, value) => sum + (parseInt(value, 10) || 0), 0);
        row.push(total); // Add the total value to the row

        // Calculate the sum of numbers after '#' for the new "Төсөв" column
        const budgetTotal = row.slice(2).reduce((sum, value) => {
          const match = value?.toString().match(/#(\d+)/);
          const numberAfterHash = match ? parseInt(match[1], 10) : 0;
          return sum + numberAfterHash;
        }, 0);
        row.push(budgetTotal); // Add the budget total value to the new column

        worksheetData.push(row);
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge Cells for Category Column
    let currentRow = 1;
    categories_illeg.forEach((category) => {
      const options = category.options;
      const rowSpan = options.length;

      worksheet["!merges"] = worksheet["!merges"] || [];
      worksheet["!merges"].push({
        s: { r: currentRow, c: 0 },
        e: { r: currentRow + rowSpan - 1, c: 0 },
      });

      currentRow += rowSpan;
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, `${roomName} Data`);
    XLSX.writeFile(workbook, `${roomName}-өдрийн_эмчилгээ.xlsx`);
  } catch (error) {
    console.error("Error occurred while exporting data:", error);
    alert("Мэдээ татах болон экспорт хийхэд алдаа гарлаа.");
  } finally {
    setIsLoadingData(false); // Reset loading state after export attempt
  }
};