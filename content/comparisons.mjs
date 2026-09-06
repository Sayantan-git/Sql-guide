export const comparisons = [
    { id: 'keys', title: 'Primary vs composite vs composite primary key', rule: 'Primary describes the identity role. Composite describes the number of columns. They are not competing categories.', columns: ['Primary key', 'Composite key', 'Composite primary key'], rows: [
        ['Meaning', 'Chosen row identity', 'Any key formed from multiple columns', 'Chosen row identity formed from multiple columns'],
        ['Columns', 'One or more', 'Two or more', 'Two or more'],
        ['Uniqueness', 'Whole key is unique', 'Whole combination identifies rows', 'Whole combination is unique'],
        ['NULL', 'No key column can be NULL', 'Depends on the enforced constraint; candidate keys are non-null identifiers', 'No component can be NULL'],
        ['Example', 'PRIMARY KEY (CustomerID)', 'UNIQUE (CountryCode, TaxNumber) with NOT NULL columns', 'PRIMARY KEY (OrderID, ProductID)'],
        ['Choose when', 'Selecting the table identity', 'Identity needs multiple attributes', 'The combined business identifier is the primary identity']
    ], concepts: ['primary-key', 'composite-key', 'candidate-key', 'unique-key'] },
    { id: 'objects', title: 'UDF vs procedure vs view vs CTE', rule: 'First choose the required contract: scalar value, composable rowset, executable command, or one-statement query organization.', columns: ['UDF / TVF', 'Stored procedure', 'Ordinary view', 'CTE'], rows: [
        ['Scope', 'Stored database object', 'Stored database object', 'Stored database object', 'One following statement'],
        ['Parameters', 'Yes', 'Yes, including OUTPUT', 'No', 'No declaration; may reference query variables'],
        ['Returns', 'Scalar or table', 'Zero/many result sets, output parameters, integer status', 'A queryable relation', 'Named query expression'],
        ['Persistent side effects', 'Not allowed in a T-SQL UDF', 'Allowed', 'Definition is a SELECT; some views accept DML', 'Underlying statement can be SELECT or DML'],
        ['Used in SELECT', 'Scalar in expressions; TVF in FROM/APPLY', 'Not directly as a table expression', 'FROM ViewName', 'FROM CteName within its statement'],
        ['Storage of result', 'Do not assume cached results; MSTVF uses a return table', 'No automatic result cache', 'Not stored for an ordinary view', 'Not guaranteed materialized'],
        ['Choose when', 'Reusable computation or parameterized relation', 'Workflow, transaction, or command API', 'Reusable relation without parameters', 'Readable query stages or recursion']
    ], concepts: ['scalar-udf', 'inline-tvf', 'multi-tvf', 'stored-procedure', 'view', 'cte'], diagram: 'flowchart TD\nNeed["What must this abstraction do?"] --> Command{"Change data or orchestrate a transaction?"}\nCommand -->|Yes| SP["Stored procedure / explicit DML"]\nCommand -->|No| Scope{"Only one statement?"}\nScope -->|Yes| CTE["CTE or derived table"]\nScope -->|No| Params{"Parameters needed?"}\nParams -->|No| View["View"]\nParams -->|Yes| Shape{"Scalar or rows?"}\nShape --> Scalar["Scalar UDF"]\nShape --> Rows["Inline TVF when possible"]' },
    { id: 'joins', title: 'INNER vs LEFT vs FULL vs CROSS JOIN', rule: 'Decide which unmatched entities must survive before selecting a join. Then verify relationship cardinality.', columns: ['INNER', 'LEFT', 'FULL OUTER', 'CROSS'], rows: [
        ['Keeps', 'Only matching pairs', 'All left rows and matching pairs', 'Matches plus unmatched rows from both sides', 'Every combination'],
        ['Unmatched right values', 'Row absent', 'NULL-extended', 'NULL-extended for either missing side', 'Not applicable'],
        ['Use case', 'Orders with known customers', 'All customers, even with no orders', 'Reconcile two systems', 'Build a product/month grid'],
        ['Row count risk', 'Many matches multiply', 'Many matches still multiply', 'Duplicate keys still multiply', 'Exactly left-count times right-count'],
        ['Syntax', 'A INNER JOIN B ON A.ID=B.ID', 'A LEFT JOIN B ON A.ID=B.ID', 'A FULL OUTER JOIN B ON A.ID=B.ID', 'A CROSS JOIN B']
    ], concepts: ['inner-join', 'left-join', 'right-full', 'cross-join'], lab: 'left-vs-inner' },
    { id: 'on-where', title: 'ON vs WHERE vs HAVING', rule: 'Match rows in ON, filter input rows in WHERE, and filter groups in HAVING.', columns: ['ON', 'WHERE', 'HAVING'], rows: [
        ['Stage', 'Relationship matching', 'After join, before grouping', 'After grouping'],
        ['Typical use', 'Join keys and optional-match qualification', 'Date/status filters on input rows', 'SUM/COUNT thresholds'],
        ['Outer-join effect', 'Restricts matches while preserving required side', 'Can remove NULL-extended rows', 'Operates on surviving groups'],
        ['Example', "ON o.CustomerID=c.CustomerID AND o.Status='Paid'", "WHERE o.Status='Paid'", 'HAVING COUNT(*) >= 2']
    ], concepts: ['outer-join-filter', 'where', 'group-having'], lab: 'left-filter' },
    { id: 'exists-in', title: 'EXISTS vs IN vs NOT EXISTS vs NOT IN', rule: 'Use membership or existence semantics deliberately; exclusion with nullable sets is where the largest correctness trap appears.', columns: ['IN', 'EXISTS', 'NOT IN', 'NOT EXISTS'], rows: [
        ['Question', 'Is this value a member?', 'Does a row exist?', 'Is this value absent from this set?', 'Is there no matching row?'],
        ['Duplicates', 'Do not multiply outer rows', 'Do not multiply outer rows', 'Do not multiply outer rows', 'Do not multiply outer rows'],
        ['NULL nuance', 'Unknown can arise for nonmatches with NULL in set', 'Subquery row presence determines TRUE/FALSE', 'NULL in set can make all nonmatches UNKNOWN', 'Not poisoned by an unrelated NULL; correlation predicate still matters'],
        ['Choose when', 'Simple value membership', 'Related-row existence', 'Set is known non-null and semantics fit', 'Reliable relationship exclusion'],
        ['Performance', 'Measure the plan', 'Not universally faster', 'Measure after correctness', 'Often expresses an anti semi join']
    ], concepts: ['exists', 'not-exists', 'in-between-like'], lab: 'null-exclusion' },
    { id: 'rank', title: 'ROW_NUMBER vs RANK vs DENSE_RANK', rule: 'Choose positions for a fixed row count, or ranks when tied values should stay together.', columns: ['ROW_NUMBER', 'RANK', 'DENSE_RANK'], rows: [
        ['100, 100, 90', '1, 2, 3', '1, 1, 3', '1, 1, 2'],
        ['Ties', 'Unique positions', 'Shared rank with gaps', 'Shared rank without gaps'],
        ['Top two', 'At most two rows per partition', 'Ranks 1 and 2; ties can increase rows', 'Top two distinct values; ties can increase rows'],
        ['Tiebreak key', 'Use one for stable row choice', 'Do not add if it should preserve value ties', 'Do not add if it should preserve value ties']
    ], concepts: ['ranking', 'second-highest', 'top-per-group'], lab: 'salary-rank' },
    { id: 'group-window', title: 'GROUP BY vs window PARTITION BY', rule: 'Use grouping to change grain; use windows to attach calculations while preserving detail.', columns: ['GROUP BY', 'OVER (PARTITION BY ...)'], rows: [
        ['Output grain', 'One result per grouping combination', 'Retains individual input rows'],
        ['Detail columns', 'Must be grouped or aggregated in T-SQL', 'Can remain alongside the window result'],
        ['Filtering', 'HAVING filters aggregates', 'Outer query filters window values'],
        ['Example', 'SELECT CustomerID, SUM(Total) ... GROUP BY CustomerID', 'SELECT OrderID, SUM(Total) OVER (PARTITION BY CustomerID) ...']
    ], concepts: ['group-having', 'window-functions', 'window-frame'], lab: 'group-window' },
    { id: 'count', title: 'COUNT(*) vs COUNT(column) vs COUNT(DISTINCT)', rule: 'Choose rows, nonmissing values, or distinct nonmissing values; they measure different things.', columns: ['COUNT(*)', 'COUNT(column)', 'COUNT(DISTINCT column)'], rows: [
        ['Measures', 'Every surviving row', 'Non-NULL expressions', 'Distinct non-NULL values'],
        ['Values A,A,NULL', '3', '2', '1'],
        ['LEFT JOIN unmatched parent', 'Counts the preserved row as 1', 'COUNT(non-null child key) gives 0', 'Depends on the chosen child attribute'],
        ['Use case', 'Order row count', 'Supplied email count', 'Different customer count']
    ], concepts: ['aggregates', 'left-join'], lab: 'count-null' },
    { id: 'delete-truncate-drop', title: 'DELETE vs TRUNCATE vs DROP', rule: 'Select the intended end state: fewer rows, an empty table, or no table.', columns: ['DELETE', 'TRUNCATE', 'DROP TABLE'], rows: [
        ['WHERE', 'Yes', 'No', 'No'],
        ['Keeps definition', 'Yes', 'Yes', 'No'],
        ['Logging in SQL Server', 'Row modifications', 'Allocation-level, not unlogged', 'Object/allocation changes'],
        ['Identity', 'Normally retains counter', 'Resets to seed behavior', 'Object removed'],
        ['DELETE triggers', 'Fire for the statement', 'Do not fire', 'Not a row-delete operation'],
        ['Rollback', 'Within active transaction', 'Yes in SQL Server active transaction', 'Generally transactional in SQL Server; restrictions apply'],
        ['Restrictions', 'FKs and triggers apply', 'Referenced FKs and other features can forbid it', 'Dependencies and permissions apply']
    ], concepts: ['delete', 'truncate-drop'] },
    { id: 'temp-cte', title: 'CTE vs #temp table vs @table variable', rule: 'Readability, reusable materialization, and table-variable scope are separate design needs.', columns: ['CTE', '#temp table', '@table variable'], rows: [
        ['Lifetime', 'One following statement', 'Session/procedure scope as created', 'Batch/routine scope'],
        ['Materialized', 'Not guaranteed', 'Yes', 'Table storage, not guaranteed memory-only'],
        ['Statistics', 'Base-object estimates', 'Column statistics available', 'No ordinary column statistics; deferred compilation can help'],
        ['Indexes', 'No direct CTE index', 'Explicit indexes supported', 'Constraint/inline indexes with limitations'],
        ['Choose', 'Readable stages/recursion', 'Reuse and complex intermediate workloads', 'Appropriate smaller/scoped rowsets; benchmark rather than assume']
    ], concepts: ['cte', 'temp-table', 'derived-table'] },
    { id: 'udf-tvf', title: 'Scalar UDF vs inline TVF vs multi-statement TVF', rule: 'Choose the return shape first; then prefer optimizer-visible logic where possible.', columns: ['Scalar UDF', 'Inline TVF', 'Multi-statement TVF'], rows: [
        ['Return shape', 'One scalar', 'Table expression', 'Table variable'],
        ['Body', 'RETURN scalar through function body', 'Single RETURN (SELECT ...)', 'Multiple statements fill return table'],
        ['Usage', 'SELECT dbo.Function(value)', 'FROM dbo.Function(value)', 'FROM dbo.Function(value)'],
        ['Performance nuance', 'Eligible scalar inlining on 2019+ can help', 'Usually expanded into outer query', 'Estimation limitations; eligible interleaved execution may help'],
        ['Side effects', 'Persistent writes prohibited', 'Persistent writes prohibited', 'Return-table writes allowed, not persistent business writes']
    ], concepts: ['scalar-udf', 'inline-tvf', 'multi-tvf'] },
    { id: 'pk-index', title: 'Primary key vs clustered vs nonclustered index', rule: 'Separate integrity constraints from physical access structures.', columns: ['Primary key', 'Clustered index', 'Nonclustered index'], rows: [
        ['Purpose', 'Chosen unique, non-null identity', 'Data organization/access', 'Additional access path'],
        ['Count', 'At most one PK constraint', 'At most one rowstore clustered index', 'Multiple permitted'],
        ['Uniqueness', 'Required', 'Can be nonunique', 'Can be unique or nonunique'],
        ['Relationship', 'Enforced by a unique index', 'May enforce a PK, or use another key', 'May enforce a PK/UNIQUE or serve queries'],
        ['Result order', 'No guarantee', 'No guarantee without ORDER BY', 'No guarantee without ORDER BY']
    ], concepts: ['primary-key', 'clustered-index', 'nonclustered-index'] },
    { id: 'union-join', title: 'UNION vs UNION ALL vs JOIN', rule: 'Set operators stack compatible rows; joins combine related row pairs into a wider result.', columns: ['UNION', 'UNION ALL', 'JOIN'], rows: [
        ['Combines', 'Rows vertically', 'Rows vertically', 'Columns/relationships horizontally'],
        ['Duplicates', 'Removed from projected rowset', 'Retained', 'Matches can multiply'],
        ['Compatibility', 'Same column count; compatible positional types', 'Same column count; compatible positional types', 'Predicate-compatible data'],
        ['Choose', 'Distinct union is required', 'All rows are meaningful', 'Related data must be attached']
    ], concepts: ['union', 'inner-join', 'intersect-except'] },
    { id: 'null-functions', title: 'COALESCE vs ISNULL vs NULLIF', rule: 'Distinguish choosing a fallback from producing NULL for a special value.', columns: ['COALESCE', 'ISNULL (T-SQL)', 'NULLIF'], rows: [
        ['Input count', 'Two or more expressions', 'Two expressions', 'Two expressions'],
        ['Returns', 'First non-NULL expression', 'First value or replacement', 'NULL if equal, otherwise first'],
        ['Result type', 'Type precedence among expressions', 'Normally first argument type/length', 'First expression type'],
        ['Common use', 'Multiple fallbacks', 'One typed fallback', 'Safe zero denominator'],
        ['Portability', 'Standard SQL', 'Engine-specific meaning', 'Standard SQL']
    ], concepts: ['coalesce-isnull', 'null', 'cast-convert'] },
    { id: 'where-window-frame', title: 'ROWS vs RANGE frames', rule: 'ROWS counts row positions; RANGE groups peers by ordering value within supported bounds.', columns: ['ROWS', 'RANGE'], rows: [
        ['Boundary', 'Physical position in logical window order', 'Logical order value / peers'],
        ['Duplicate sort values', 'Can progress one row at a time', 'Peers at the current value share the boundary'],
        ['Typical running total', 'Explicit ROWS UNBOUNDED PRECEDING', 'May be the implicit frame for ordered aggregates'],
        ['T-SQL restrictions', 'Supports row-count offsets', 'Limited bounds; not arbitrary numeric offsets like some engines']
    ], concepts: ['window-frame', 'lag-lead', 'ranking'] },
    { id: 'isolation', title: 'READ COMMITTED vs RCSI vs SNAPSHOT vs SERIALIZABLE', rule: 'Choose a visibility contract and concurrency strategy, not just an isolation name.', columns: ['Locking READ COMMITTED', 'RCSI', 'SNAPSHOT', 'SERIALIZABLE'], rows: [
        ['View', 'Committed data as read', 'Committed statement snapshot', 'Committed transaction snapshot', 'Serializable behavior through suitable protection'],
        ['Typical read locks', 'Shared locks during reads', 'Versioned data reads', 'Versioned data reads', 'Rows and relevant key ranges'],
        ['Repeatable transaction view', 'Not guaranteed', 'Not across statements', 'Yes, snapshot semantics', 'Protected against relevant concurrent anomalies'],
        ['Tradeoff', 'Blocking/nonrepeatable reads', 'Version-store cost', 'Version-store cost and write conflicts', 'More blocking/deadlock potential']
    ], concepts: ['isolation', 'snapshot', 'locks', 'nolock'] },
    { id: 'char-types', title: 'char vs varchar vs nvarchar', rule: 'Choose by text domain, collation/encoding, and length behavior—not slogans about ASCII or bytes.', columns: ['char(n)', 'varchar(n)', 'nvarchar(n)'], rows: [
        ['Shape', 'Fixed length', 'Variable length', 'Variable length Unicode'],
        ['Typical use', 'Truly fixed codes', 'Variable text with suitable collation/encoding', 'Multilingual text under Unicode collations'],
        ['Length meaning', 'Bytes', 'Bytes; UTF-8 may use multiple bytes/character', 'Byte-pairs; supplementary characters can need two'],
        ['Example', 'CountryCode char(2)', 'SKU varchar(40)', 'Name nvarchar(100)'],
        ['Caution', 'Padding and comparison rules', 'Code page or UTF-8 collation matters', "N'...' literals for Unicode in T-SQL"]
    ], concepts: ['data-types', 'string-functions'] },
    { id: 'identity-rowversion', title: 'IDENTITY vs SEQUENCE vs rowversion', rule: 'Number generation and change detection are different problems; rowversion is not a clock.', columns: ['IDENTITY', 'SEQUENCE', 'rowversion'], rows: [
        ['Purpose', 'Generate per-table IDs', 'Generate numbers from an object', 'Detect row updates'],
        ['Scope', 'One column/table', 'Independent object, reusable', 'Database-generated binary counter'],
        ['Gapless', 'No', 'No', 'Not a business sequence'],
        ['Uniqueness enforcement', 'Requires PK/UNIQUE', 'Requires target constraint', 'Not a meaningful stable PK'],
        ['Use case', 'Surrogate row ID', 'Ticket allocator across tables', 'Optimistic update token']
    ], concepts: ['identity-sequence', 'optimistic', 'temporal'] },
    { id: 'exists-left-except', title: 'NOT EXISTS vs LEFT anti join vs EXCEPT', rule: 'Exclusion patterns can agree for unique non-null keys, but differ in duplicates and NULL semantics.', columns: ['NOT EXISTS', 'LEFT JOIN ... IS NULL', 'EXCEPT'], rows: [
        ['Multiplicity', 'Preserves qualifying left rows', 'Preserves left rows without matches', 'Returns distinct differences'],
        ['NULL detail', 'Equality correlation does not match NULL to NULL', 'Test a non-nullable right key', 'NULLs compare as equal for distinct set operations'],
        ['Use', 'Relationship absence', 'Absence when join is already needed', 'Distinct rowset reconciliation'],
        ['Pitfall', 'Incorrect correlation', 'Testing a nullable right attribute', 'Assuming duplicates are retained']
    ], concepts: ['not-exists', 'left-join', 'intersect-except'] }
];