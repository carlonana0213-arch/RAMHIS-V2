import "../../styles/component-styles/tableSkeleton.css";
function TableSkeleton({ rows = 6, columns = 6 }) {
  return (
    <div className="table-skeleton-wrapper">
      <table className="table-skeleton">
        <thead>
          <tr>
            {[...Array(columns)].map((_, index) => (
              <th key={index}>
                <div className="skeleton skeleton-header" />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex}>
                  <div className="skeleton skeleton-cell" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableSkeleton;
