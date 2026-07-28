// ─── Operation Insights Knowledge Base ──────────────────────────────
// Provides educational content for each data operation: what it does,
// pros/cons, alternatives, and beginner-friendly explanations.
// Also answers common dataset questions from stats.

export interface OperationInsight {
    title: string
    description: string
    pros: string[]
    cons: string[]
    alternatives: string[]
    learnMore: string
    icon: string
    color: string // tailwind color class
}

export interface OperationLogEntry {
    id: string
    operation: string
    params: Record<string, any>
    timestamp: Date
    insight: OperationInsight
}

// ─── Operation Insight Generator ────────────────────────────────────

export function getOperationInsight(
    operation: string,
    params: Record<string, any>,
    stats: any
): OperationInsight {
    switch (operation) {
        case 'nulls':
            return getNullInsight(params, stats)
        case 'duplicates':
            return getDuplicateInsight(params, stats)
        case 'encode':
            return getEncodeInsight(params, stats)
        case 'convert':
            return getConvertInsight(params, stats)
        case 'normalize':
            return getNormalizeInsight(params, stats)
        case 'filter':
            return getFilterInsight(params, stats)
        default:
            return {
                title: 'Operation Applied',
                description: `Applied "${operation}" to your dataset.`,
                pros: ['Data modified as requested'],
                cons: ['Review the changes to ensure correctness'],
                alternatives: [],
                learnMore: 'Each data operation transforms your dataset in a specific way. Always verify the results.',
                icon: 'build',
                color: 'slate',
            }
    }
}

// ─── Null Handling Insights ─────────────────────────────────────────

function getNullInsight(params: Record<string, any>, stats: any): OperationInsight {
    const strategy = params.strategy || 'fill_median'
    const nullCount = stats?.null_count || 0

    const insights: Record<string, OperationInsight> = {
        drop: {
            title: 'Dropped Rows with Nulls',
            description: `Removed rows containing missing values. ${nullCount > 0 ? `Your dataset had ${nullCount} null values.` : ''}`,
            pros: [
                'Ensures completely clean data with no missing values',
                'Simple and straightforward — no assumptions about data',
                'Best when missing data is random and dataset is large',
            ],
            cons: [
                'Reduces dataset size — may lose valuable data',
                'Can introduce bias if data is not missing randomly',
                'Not suitable for small datasets where every row matters',
            ],
            alternatives: [
                'Fill with Median — robust to outliers, good for skewed data',
                'Fill with Mean — works well for normally distributed data',
                'Fill with Mode — best for categorical columns',
            ],
            learnMore: 'Dropping rows is called "listwise deletion". It\'s the simplest approach but can be wasteful. If more than 5-10% of your data has nulls, consider imputation methods instead. The key question is: are the values "Missing Completely At Random" (MCAR)? If yes, dropping is safe. If not, dropping can bias your model.',
            icon: 'delete_sweep',
            color: 'red',
        },
        fill_mean: {
            title: 'Filled Nulls with Mean',
            description: `Replaced missing values with the column average.`,
            pros: [
                'Preserves dataset size — no rows lost',
                'Maintains the overall average of the column',
                'Works well when data is normally distributed (bell curve)',
            ],
            cons: [
                'Sensitive to outliers — a few extreme values skew the mean',
                'Reduces variance in the data (makes it less spread out)',
                'Not suitable for skewed distributions or categorical data',
            ],
            alternatives: [
                'Fill with Median — better for skewed data, resistant to outliers',
                'Fill with Mode — better for categorical columns',
                'Drop rows — if missing data is small (<5%) and random',
            ],
            learnMore: 'Mean imputation replaces each missing value with the average. While simple, it "shrinks" your data toward the center, reducing variance. This can make your model underestimate relationships. For skewed data (like income or house prices), median is almost always better because it ignores outliers.',
            icon: 'calculate',
            color: 'blue',
        },
        fill_median: {
            title: 'Filled Nulls with Median',
            description: `Replaced missing values with the column median (middle value).`,
            pros: [
                'Robust to outliers — not affected by extreme values',
                'Preserves dataset size — no rows lost',
                'Best default choice for numeric columns with unknown distribution',
            ],
            cons: [
                'Still reduces variance slightly',
                'May not make sense for perfectly normal data (mean is better there)',
                'Doesn\'t capture relationships between columns',
            ],
            alternatives: [
                'Fill with Mean — if data is normally distributed with no outliers',
                'Drop rows — if nulls are few and data is large',
                'Fill with Mode — for categorical (text) columns',
            ],
            learnMore: 'The median is the "middle" value when data is sorted. Unlike the mean, it ignores outliers. For example, incomes [30K, 35K, 40K, 45K, 1M] have mean=230K (skewed by the millionaire) but median=40K (more representative). This is why median imputation is the most commonly recommended default.',
            icon: 'vertical_align_center',
            color: 'green',
        },
        fill_mode: {
            title: 'Filled Nulls with Mode',
            description: `Replaced missing values with the most frequent value.`,
            pros: [
                'Works for both numeric AND categorical columns',
                'Preserves the most common pattern in the data',
                'Simple and intuitive',
            ],
            cons: [
                'If no clear mode exists (all values unique), it picks arbitrarily',
                'Overrepresents the most common value',
                'Can distort the data distribution significantly',
            ],
            alternatives: [
                'Fill with Median — better for numeric data',
                'Fill with Mean — for normally distributed numeric data',
                'Drop rows — when data is large and nulls are few',
            ],
            learnMore: 'Mode is the most frequently occurring value. It\'s the only imputation method that works for categorical (text) data. For example, if a "Color" column has values [Red, Blue, Red, Red, null], mode fills null with "Red". For numeric data, median is usually preferred.',
            icon: 'format_list_numbered',
            color: 'purple',
        },
    }

    return insights[strategy] || insights['fill_median']
}

// ─── Duplicate Handling Insights ────────────────────────────────────

function getDuplicateInsight(params: Record<string, any>, _stats: any): OperationInsight {
    const removedCount = params.removed_count || 0
    return {
        title: `Removed ${removedCount} Duplicate Rows`,
        description: `Found and removed ${removedCount} duplicate row${removedCount !== 1 ? 's' : ''} from your dataset, keeping the first occurrence.`,
        pros: [
            'Prevents model bias from overrepresented data points',
            'Reduces dataset size and speeds up training',
            'Ensures each data point contributes unique information',
        ],
        cons: [
            'Some "duplicates" may be legitimate repeated observations',
            'In time-series data, repeated values may be meaningful',
            'Reduces dataset size — could be an issue for small datasets',
        ],
        alternatives: [
            'Keep last occurrence instead of first',
            'Remove only exact duplicates (check specific columns instead of all)',
            'Mark duplicates with a flag column instead of removing',
        ],
        learnMore: 'Duplicates can enter your data through data collection errors, merging datasets, or scraping. While removing them is usually correct, be careful: in some domains (like transaction logs), the same values appearing multiple times may represent real events. Always verify a sample of duplicates before bulk removal.',
        icon: 'content_copy',
        color: 'orange',
    }
}

// ─── Encoding Insights ──────────────────────────────────────────────

function getEncodeInsight(params: Record<string, any>, _stats: any): OperationInsight {
    const method = params.method || 'label'
    const column = params.column || 'column'

    const insights: Record<string, OperationInsight> = {
        label: {
            title: `Label Encoded "${column}"`,
            description: `Converted text categories to integer labels (e.g., Red=0, Blue=1, Green=2).`,
            pros: [
                'Simple and memory-efficient — single column output',
                'Works with any ML algorithm',
                'Preserves column count (no dimensionality increase)',
            ],
            cons: [
                'Introduces false ordinal relationship (model thinks Green>Blue>Red)',
                'Can confuse algorithms like Linear Regression that interpret magnitude',
                'Order assignment is arbitrary',
            ],
            alternatives: [
                'One-Hot Encoding — creates separate 0/1 columns, no false ordering',
                'Ordinal Encoding — use when categories have natural order (Low < Medium < High)',
            ],
            learnMore: 'Label Encoding assigns integers to categories: Cat=0, Dog=1, Fish=2. The problem? ML models may interpret 2 > 1 > 0, implying Fish > Dog > Cat — which is meaningless! Use Label Encoding only for tree-based models (Random Forest, XGBoost) which handle this well. For linear models, use One-Hot instead.',
            icon: 'label',
            color: 'blue',
        },
        onehot: {
            title: `One-Hot Encoded "${column}"`,
            description: `Created separate binary (0/1) columns for each category.`,
            pros: [
                'No false ordinal relationships — categories are truly independent',
                'Works perfectly with linear models (Logistic Regression, SVM)',
                'Most mathematically correct encoding for nominal categories',
            ],
            cons: [
                'Increases number of columns (high cardinality = many new columns)',
                'Can cause "curse of dimensionality" with many categories',
                'Sparse data — most values will be 0',
            ],
            alternatives: [
                'Label Encoding — simpler, use with tree models (Random Forest, XGBoost)',
                'Ordinal Encoding — use when categories have natural order',
            ],
            learnMore: 'One-Hot creates a new binary column for each category. "Color" with [Red, Blue, Green] becomes 3 columns: Color_Red (0/1), Color_Blue (0/1), Color_Green (0/1). This is the gold standard for nominal (unordered) categories. Warning: if a column has 1000 unique values, you\'ll get 1000 new columns!',
            icon: 'grid_on',
            color: 'green',
        },
        ordinal: {
            title: `Ordinal Encoded "${column}"`,
            description: `Converted categories to integers preserving natural order.`,
            pros: [
                'Preserves meaningful order relationships (Small < Medium < Large)',
                'Memory efficient — single column',
                'Perfect for inherently ordered categories',
            ],
            cons: [
                'Assumes equal spacing between categories (may not be true)',
                'Wrong if categories have no natural order',
                'Model may overweight the magnitude differences',
            ],
            alternatives: [
                'One-Hot Encoding — if categories have no natural order',
                'Label Encoding — similar but with arbitrary order assignment',
            ],
            learnMore: 'Ordinal Encoding is for categories with a natural rank: Education (High School < Bachelor\'s < Master\'s < PhD), Size (S < M < L < XL), Satisfaction (Low < Medium < High). The key difference from Label Encoding: ordinal order is meaningful, label order is arbitrary.',
            icon: 'sort',
            color: 'purple',
        },
    }

    return insights[method] || insights['label']
}

// ─── Datatype Conversion Insights ───────────────────────────────────

function getConvertInsight(params: Record<string, any>, _stats: any): OperationInsight {
    const targetType = params.targetType || params.target_type || 'int'
    const column = params.column || 'column'

    const insights: Record<string, OperationInsight> = {
        int: {
            title: `Converted "${column}" to Integer`,
            description: `Changed column type to whole numbers. Non-numeric values (text, symbols) were cleaned or set to null.`,
            pros: [
                'Enables mathematical operations (sum, mean, correlation)',
                'Required for most ML algorithms (they need numbers)',
                'Integers use less memory than strings',
            ],
            cons: [
                'Loses decimal precision (3.7 becomes 4)',
                'Non-convertible text values become null',
                'May lose meaningful string information (e.g., "50,000 kms" loses "kms")',
            ],
            alternatives: [
                'Convert to Float — preserves decimals (3.14 stays 3.14)',
                'Keep as String + Label Encode — if values are categories, not numbers',
            ],
            learnMore: 'ML models need numbers! If your "Price" column stores "₹34,000" as text, the model can\'t do math on it. Converting to int strips commas, currency symbols, and units, keeping only the number. Values that can\'t be converted (like "Ask For Price") become null — you can handle those with null imputation.',
            icon: 'pin',
            color: 'green',
        },
        float: {
            title: `Converted "${column}" to Float`,
            description: `Changed column type to decimal numbers. Preserves precision.`,
            pros: [
                'Preserves decimal precision (3.14159 stays exact)',
                'Enables all mathematical operations',
                'Most ML algorithms internally use float anyway',
            ],
            cons: [
                'Uses more memory than integers',
                'Floating-point precision issues (0.1 + 0.2 ≈ 0.30000000000000004)',
                'Non-convertible text values become NaN',
            ],
            alternatives: [
                'Convert to Integer — if values are whole numbers (counts, IDs)',
                'Keep as String — if values are categories, not measurements',
            ],
            learnMore: 'Float (floating-point) numbers can represent decimals: 3.14, 0.001, 99.99. They\'re the standard numeric type in ML. When in doubt between int and float, choose float — it\'s more flexible. The small memory overhead is rarely a problem.',
            icon: 'decimal_increase',
            color: 'emerald',
        },
        str: {
            title: `Converted "${column}" to String`,
            description: `Changed column type to text. All values are now treated as categorical.`,
            pros: [
                'Preserves all original text information',
                'Allows string operations (contains, starts_with, regex)',
                'Prevents numeric interpretation of IDs (ZIP codes, phone numbers)',
            ],
            cons: [
                'Cannot perform math operations (sum, mean, etc.)',
                'Must be encoded before ML training',
                'Takes more memory than numeric types',
            ],
            alternatives: [
                'Keep as Integer — if values are truly numeric (not IDs)',
                'Convert + Encode — convert to string then one-hot encode',
            ],
            learnMore: 'Some numbers aren\'t really "numbers" — ZIP codes (10001), phone numbers, and IDs shouldn\'t be averaged or summed. Converting these to strings prevents the ML model from treating them as quantities. Fun fact: "90210" as a number means your model thinks that ZIP code is "larger" than "10001"!',
            icon: 'text_fields',
            color: 'pink',
        },
        datetime: {
            title: `Converted "${column}" to DateTime`,
            description: `Parsed text dates into proper datetime format for time-based analysis.`,
            pros: [
                'Enables time-based operations (day of week, month, year)',
                'Allows proper date sorting and filtering',
                'Can extract powerful features (season, weekday, time since event)',
            ],
            cons: [
                'Unparseable dates become null',
                'Many date formats exist — automatic parsing may misinterpret some',
                'DateTime objects use more memory than simple integers',
            ],
            alternatives: [
                'Extract year/month/day as separate integer columns',
                'Convert to Unix timestamp (single integer)',
                'Keep as String — if date format is unusual',
            ],
            learnMore: 'DateTime conversion is powerful for feature engineering! From a single date column, you can extract: year, month, day, weekday, hour, quarter, "is_weekend", "days_since_event", and more. These derived features often dramatically improve model performance for time-dependent data.',
            icon: 'calendar_month',
            color: 'blue',
        },
    }

    return insights[targetType] || insights['int']
}

// ─── Normalize Insights ─────────────────────────────────────────────

function getNormalizeInsight(_params: Record<string, any>, stats: any): OperationInsight {
    const numericCount = stats?.numeric_columns?.length || 0
    return {
        title: `Normalized ${numericCount} Numeric Columns`,
        description: `Applied StandardScaler normalization — values transformed to mean=0, standard deviation=1.`,
        pros: [
            'Essential for distance-based algorithms (KNN, SVM, K-Means)',
            'Prevents features with larger scales from dominating',
            'Speeds up gradient-based optimization (Neural Networks, Logistic Regression)',
        ],
        cons: [
            'Makes values harder to interpret (original scale is lost)',
            'Not needed for tree-based models (Random Forest, XGBoost)',
            'Outliers still have large normalized values',
        ],
        alternatives: [
            'Min-Max Scaling — scales to [0, 1] range, good for neural networks',
            'Robust Scaler — uses median/IQR, better with outliers',
            'Log Transform — compresses right-skewed distributions',
            'Skip normalization — if using tree-based models only',
        ],
        learnMore: 'Imagine comparing house prices ($100K-$1M) with bedroom count (1-5). Without normalization, price dominates because its numbers are huge. StandardScaler makes both columns have mean=0, std=1, so they contribute equally. Rule of thumb: always normalize for linear models, neural networks, and distance-based methods. Skip it for tree-based methods.',
        icon: 'auto_fix_high',
        color: 'cyan',
    }
}

// ─── Filter Insights ────────────────────────────────────────────────

function getFilterInsight(params: Record<string, any>, _stats: any): OperationInsight {
    const column = params.column || 'column'
    const operator = params.operator || '=='
    const value = params.value || ''
    return {
        title: `Filtered Data: ${column} ${operator} ${value}`,
        description: `Removed rows where "${column}" ${operator} "${value}" is not true.`,
        pros: [
            'Focuses analysis on relevant subset of data',
            'Removes noise and irrelevant records',
            'Can improve model performance by removing outliers',
        ],
        cons: [
            'Reduces dataset size',
            'May introduce selection bias',
            'Filtered-out data is permanently removed (can\'t undo easily)',
        ],
        alternatives: [
            'Use multiple filters for complex conditions',
            'Create a flag column instead of removing rows',
            'Use outlier detection methods for automated filtering',
        ],
        learnMore: 'Filtering is one of the most common data operations. It\'s like applying a WHERE clause in SQL. Be careful about selection bias — for example, filtering out all customers under 18 might seem harmless, but could bias your model if age matters. Always document what you filtered and why.',
        icon: 'filter_alt',
        color: 'amber',
    }
}

// ─── Dataset Query Answerer ─────────────────────────────────────────

export function answerDatasetQuery(question: string, stats: any): string {
    if (!stats) return 'Please upload a dataset first to ask questions about it.'

    const q = question.toLowerCase().trim()

    // Null-related questions
    if (q.match(/null|missing|empty|nan/)) {
        const nullCount = stats.null_count || 0
        if (nullCount === 0) return '✅ Your dataset has no missing (null) values! It\'s clean in that regard.'
        
        const nullDetails = stats.null_counts
            ? Object.entries(stats.null_counts as Record<string, number>)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([col, count]) => `  • **${col}**: ${count} nulls`)
                .join('\n')
            : ''
        return `⚠️ Found **${nullCount}** total null values:\n${nullDetails}\n\n**Suggestion:** Use "Handle Nulls" with Median for numeric columns or Mode for categorical.`
    }

    // Duplicate questions
    if (q.match(/duplicate|repeated|same row/)) {
        const dupCount = stats.duplicate_count || 0
        if (dupCount === 0) return '✅ No duplicate rows found!'
        return `⚠️ Found **${dupCount}** duplicate rows.\n\n**Suggestion:** Remove them using the "Duplicates" operation to prevent model bias.`
    }

    // Column type questions
    if (q.match(/type|dtype|data type|column type|what type/)) {
        const types = stats.column_types as Record<string, string> | undefined
        if (!types) return 'No column type information available.'
        const typeList = Object.entries(types)
            .map(([col, t]) => `  • **${col}**: \`${t}\``)
            .join('\n')
        return `📋 Column data types:\n${typeList}`
    }

    // Column count/names
    if (q.match(/how many col|column name|list col|what col|which col/)) {
        const cols = stats.columns || []
        return `📊 Your dataset has **${cols.length}** columns:\n${cols.map((c: string) => `  • ${c}`).join('\n')}`
    }

    // Row count
    if (q.match(/how many row|row count|size|shape|dimension/)) {
        return `📊 Dataset shape: **${stats.total_rows}** rows × **${stats.total_columns}** columns`
    }

    // Unique values
    if (q.match(/unique|distinct|cardinality/)) {
        const uniques = stats.unique_counts as Record<string, number> | undefined
        if (!uniques) return 'No unique count data available.'
        const sorted = Object.entries(uniques)
            .sort(([, a], [, b]) => (b as number) - (a as number))
        const list = sorted.map(([col, count]) => `  • **${col}**: ${count} unique`).join('\n')
        return `🔢 Unique values per column:\n${list}\n\n**Highest:** ${sorted[0][0]} (${sorted[0][1]} unique)\n**Lowest:** ${sorted[sorted.length - 1][0]} (${sorted[sorted.length - 1][1]} unique)`
    }

    // Numeric/categorical
    if (q.match(/numeric|categorical|category|object|continuous/)) {
        const numCols = stats.numeric_columns?.length || 0
        const catCols = stats.categorical_columns?.length || 0
        return `📊 Feature types:\n  • **Numeric** (int/float): ${numCols} columns\n  • **Categorical** (object/text): ${catCols} columns\n\n${catCols > 0 ? '💡 Encode categorical columns before training.' : ''}`
    }

    // Ready for training
    if (q.match(/ready|train|can i train|good enough|clean enough/)) {
        const issues: string[] = []
        if (stats.null_count > 0) issues.push(`${stats.null_count} null values — handle with imputation`)
        if (stats.duplicate_count > 0) issues.push(`${stats.duplicate_count} duplicate rows — consider removing`)
        const catCols = stats.categorical_columns?.length || 0
        if (catCols > 0) issues.push(`${catCols} categorical columns — must encode before training`)

        if (issues.length === 0)
            return '✅ Your dataset looks **ready for training**! All values are numeric and no nulls or duplicates found.'
        return `⚠️ Not quite ready yet. Address these issues:\n${issues.map(i => `  • ${i}`).join('\n')}\n\nOnce resolved, your data will be model-ready!`
    }

    // What to do next
    if (q.match(/what (should|can|do) i do|next step|suggest|recommend|help/)) {
        const suggestions: string[] = []
        if (stats.null_count > 0) suggestions.push('🔧 **Handle Nulls** — use Median imputation for numeric, Mode for categorical')
        if (stats.duplicate_count > 0) suggestions.push('🗑️ **Remove Duplicates** — prevents bias from repeated data')
        const catCols = stats.categorical_columns?.length || 0
        if (catCols > 0) suggestions.push(`🏷️ **Encode Categorical** — ${catCols} text columns need encoding for ML`)
        const objCols = stats.column_types ? Object.values(stats.column_types as Record<string, string>).filter(t => t === 'object').length : 0
        if (objCols > 0) suggestions.push(`🔄 **Convert Data Types** — ${objCols} object columns may contain hidden numbers`)
        suggestions.push('📏 **Normalize** — scale numeric data for distance-based models')
        suggestions.push('📊 **Visualize** — check distributions and correlations')

        return `📝 Recommended next steps:\n${suggestions.join('\n')}`
    }

    // Correlation
    if (q.match(/correlat/)) {
        return '📈 Switch to the **Visualize** tab to see the correlation heatmap. Correlation shows how numeric columns relate to each other (-1 = inverse, 0 = no relation, +1 = strong positive). Requires at least 2 numeric columns.'
    }

    // Outlier
    if (q.match(/outlier|extreme|anomal/)) {
        return '📊 Check the **Visualize** tab for distribution charts. Values that are far from the mean (>3 standard deviations) may be outliers. You can use **Filter Data** to remove them, or **Normalize** to reduce their impact.'
    }

    // Distribution
    if (q.match(/distribut|histogram|skew/)) {
        return '📊 Switch to the **Visualize** tab to see value distributions for all columns. Look for: skewed distributions (use median imputation), uniform distributions (generally fine), and bimodal patterns (may need separate analysis).'
    }

    // Default response
    return `🤔 I can answer questions about your dataset! Try asking:\n  • "How many nulls are there?"\n  • "What are the column types?"\n  • "Is my data ready for training?"\n  • "What should I do next?"\n  • "How many unique values?"\n  • "Tell me about duplicates"\n  • "What about correlations?"`
}
