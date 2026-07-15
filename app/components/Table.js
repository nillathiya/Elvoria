"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import styles from "./Table.module.css";

export default function Table({
  columns = [],
  data = [],
  sortKey = null,
  sortDir = "asc",
  onSort = null,
  striped = true,
  emptyMessage = "No records found",
}) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => {
              const sortable = col.sortable && onSort;
              const active = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  className={[
                    styles.th,
                    col.align === "right" ? styles.right : "",
                    col.align === "center" ? styles.center : "",
                    sortable ? styles.sortable : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={sortable ? () => onSort(col.key) : undefined}
                >
                  <span className={styles.thInner}>
                    {col.header}
                    {sortable && (
                      <span className={styles.sortIcon}>
                        {active ? (
                          sortDir === "asc" ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ChevronsUpDown size={14} />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className={styles.empty} colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={striped ? styles.striped : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      styles.td,
                      col.align === "right" ? styles.right : "",
                      col.align === "center" ? styles.center : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-label={col.header}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
