package postgres

import (
	"fmt"
	"strings"
)

// QueryBuilder helps in constructing SQL queries for the library service
type QueryBuilder struct {
	baseQuery  string
	where      []string
	args       []any
	orderBy    string
	limit      int
	offset     int
	argCounter int
}

// NewQueryBuilder creates a new QueryBuilder instance
func NewQueryBuilder(baseQuery string) *QueryBuilder {
	return &QueryBuilder{
		baseQuery:  baseQuery,
		where:      []string{},
		args:       []any{},
		argCounter: 1,
	}
}

// Where adds a WHERE condition to the query
func (qb *QueryBuilder) Where(condition string, arg any) *QueryBuilder {
	// Replaces $ placeholder with ordered placeholder $1, $2, etc.
	placeholder := fmt.Sprintf("$%d", qb.argCounter)
	updatedCondition := strings.Replace(condition, "$", placeholder, 1)

	qb.where = append(qb.where, updatedCondition)
	qb.args = append(qb.args, arg)
	qb.argCounter++
	return qb
}

// OrderBy sets the ORDER BY clause
func (qb *QueryBuilder) OrderBy(orderBy string) *QueryBuilder {
	qb.orderBy = orderBy
	return qb
}

// Limit sets the LIMIT clause
func (qb *QueryBuilder) Limit(limit int) *QueryBuilder {
	qb.limit = limit
	return qb
}

// Offset sets the OFFSET clause
func (qb *QueryBuilder) Offset(offset int) *QueryBuilder {
	qb.offset = offset
	return qb
}

// Build constructs the final SQL query and returns arguments
func (qb *QueryBuilder) Build() (string, []any) {
	var sb strings.Builder
	sb.WriteString(qb.baseQuery)

	if len(qb.where) > 0 {
		sb.WriteString(" WHERE ")
		sb.WriteString(strings.Join(qb.where, " AND "))
	}

	if qb.orderBy != "" {
		sb.WriteString(" ORDER BY ")
		sb.WriteString(qb.orderBy)
	}

	if qb.limit > 0 || qb.limit == -1 {
		if qb.limit != -1 {
			sb.WriteString(fmt.Sprintf(" LIMIT $%d", qb.argCounter))
			qb.args = append(qb.args, qb.limit)
			qb.argCounter++
		}
	}

	if qb.offset > 0 {
		sb.WriteString(fmt.Sprintf(" OFFSET $%d", qb.argCounter))
		qb.args = append(qb.args, qb.offset)
		qb.argCounter++
	}

	return sb.String(), qb.args
}
