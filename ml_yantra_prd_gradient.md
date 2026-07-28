# ML Yantra - Product Requirements Document (Gradient Theme)

---

## Project Information

### Project Title

**ML Yantra**

---

### Project Description

**Short Description:**
ML Yantra is a comprehensive web-based machine learning platform that empowers users—from complete beginners to experienced data scientists—to understand, prepare, visualize, and train ML models without writing a single line of code.

**Long Description:**

In today's data-driven world, machine learning has become essential for deriving insights and making predictions. However, the technical barrier to entry—requiring knowledge of Python, data science libraries, and ML algorithms—prevents many professionals from leveraging these powerful techniques. Business analysts, domain experts, students, and even experienced data scientists spend countless hours on repetitive data cleaning and model training tasks. Meanwhile, aspiring learners struggle to bridge the gap between theoretical ML knowledge and practical application, lacking an interactive environment where they can learn by doing.

ML Yantra addresses both challenges simultaneously by combining a powerful no-code ML workspace with an **integrated learning academy (ML Academy)** that teaches machine learning concepts through hands-on, interactive lessons. The platform's intelligent AI assistant analyzes your dataset in real-time, suggests the best next steps with clear explanations, and acts as your personal data science mentor—explaining not just *what* to do, but *why*.

The platform offers sophisticated data preparation capabilities including intelligent null value handling, duplicate detection, flexible data type conversion, multiple encoding strategies (Label, One-Hot, Ordinal), advanced filtering, comprehensive column management, and **multi-sheet Excel workspace support** with merge/join/concatenate operations—all backed by a robust undo/redo system with real-time data preview at every step.

**Rich data visualization** is woven throughout the experience: interactive histograms, box plots, correlation heatmaps, null pattern matrices, and scatter plots help users understand their data before training. Post-training, confusion matrices, ROC curves, feature importance charts, learning curves, and model comparison radars make evaluation intuitive and insightful.

Once data is cleaned, users seamlessly transition to model training where ML Yantra supports a comprehensive suite of algorithms: classification models (Logistic Regression, Random Forest, Decision Tree, SVM) and regression models (Linear Regression, Random Forest Regressor, Decision Tree Regressor, SVR, XGBoost). The AI assistant recommends which algorithms to try based on your data characteristics and problem type.

By democratizing machine learning with AI-powered guidance, ML Yantra accelerates innovation across industries, enabling business users to test hypotheses rapidly, students to learn ML concepts through hands-on practice with instant feedback, and data scientists to prototype models 10x faster than traditional coding workflows.

---

### Learning Objectives

**Primary Learning Outcomes:**

- **End-to-End ML Workflow**: Understand the complete machine learning pipeline from raw data to trained model deployment
- **Data Cleaning Best Practices**: Master essential data preparation techniques including handling missing values, duplicate removal, and feature encoding
- **Model Selection & Evaluation**: Learn to compare different algorithms and select the optimal model based on performance metrics
- **Full-Stack Web Development**: Build complex web applications using React 19, TypeScript, FastAPI, and modern state management
- **API Design & Integration**: Create RESTful APIs and integrate frontend-backend systems with proper error handling and data validation

**Secondary Learning Outcomes:**

- **Responsive UI/UX Design**: Implement accessible, mobile-first interfaces following modern design systems
- **State Management Patterns**: Utilize Zustand for predictable state management in complex applications
- **Interactive Data Visualization**: Create compelling charts and graphs using modern visualization libraries
- **Python ML Libraries**: Work with scikit-learn, pandas, and XGBoost for data processing and model training
- **Software Architecture**: Design modular, maintainable codebases with clear separation of concerns

---

### Technology Stack

**Frontend:**

- **Build Tool:** Vite 6.x
- **Framework:** React 19 with TypeScript 5
- **Routing:** React Router v7
- **State Management:** Zustand 5.x
- **Styling:** Tailwind CSS v4 + DaisyUI v5.5
- **Icons:** Google Material Symbols (Rounded variant)
- **Data Visualization:** Recharts / Chart.js
- **HTTP Client:** Axios
- **File Upload:** React Dropzone
- **Additional Libraries:** 
  - React Hot Toast (notifications)
  - Framer Motion (animations)
  - date-fns (date utilities)

**Backend:**

- **Runtime:** Node.js v22 LTS (for build tools)
- **Language:** Python 3.11+
- **Framework:** FastAPI v0.110+
- **Database:** SQLite (development) / PostgreSQL (production)
- **ORM:** SQLAlchemy 2.0
- **ML Libraries:**
  - pandas 2.1+ (data manipulation)
  - scikit-learn 1.4+ (ML algorithms)
  - XGBoost 2.0+ (advanced models)
  - NumPy 1.26+ (numerical computing)
- **Additional Libraries:**
  - Pydantic 2.0+ (data validation)
  - python-multipart (file uploads)
  - uvicorn (ASGI server)

### System Infrastructure & Security

- **Memory Constraints:** Hard-enforced HTTP 413 checks block files exceeding 100MB pre-memory ingestion.
- **Workbook Profiling:** Excel processing explicitly denies workbooks containing more than 10 sheets to prevent exponential memory consumption.
- **RCE Mitigation:** Mathematical computations (`feature_engineering`) safely evaluate strictly via Pandas `numexpr` C-based engine, completely eliminating arbitrary python-execution payloads.
- **Storage Sweeping (DoS Prevention):** Background `asyncio` loop wired directly to FastAPI's lifespan purges unused cache-data artifacts every hour, restricting filesystem exhaustion.

---

### MVP Scope

**Phase 1: Core Data Preparation (Days 1-10)**
**Priority: P0 (Must Have)**

1. **File Upload & Dataset Management**
   - Drag-and-drop CSV and Excel (.xlsx, .xls) file upload (max 100MB)
   - Multi-sheet Excel support with per-sheet workspace tabs
   - Sheet merge operations (concatenate rows/columns, SQL-style joins)
   - Dataset preview with basic statistics
   - Column type detection and metadata display
   - Dataset session management

2. **Essential Data Cleaning Operations**
   - Null value handling (drop rows/columns, fill with mean/median/mode/custom)
   - Duplicate detection and removal
   - Data type conversion (numeric, categorical, datetime)
   - Column encoding (Label Encoding, One-Hot Encoding, Ordinal Encoding)
   - Advanced filtering (numeric ranges, categorical selections, text contains/equals)
   - Column management (drop, rename, reorder)

3. **AI Assistant & Guidance**
   - Context-aware suggestions panel
   - Dataset analysis and recommendations
   - Operation explanations (why/when to use each)
   - Best practice tips based on data characteristics
   - Alert for potential data quality issues
   - Full operation history tracking
   - Undo/redo with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
   - History visualization showing operation timeline
   - Real-time data preview after each operation (adjustable row count slider 1-50)

**Phase 2: Model Training & Evaluation (Days 11-20)**
**Priority: P0 (Must Have)**

4. **Model Configuration**
   - Target variable selection
   - Feature selection interface
   - Configurable Train/Test/Validation splitting (optional 3-way split)
   - Classification vs Regression auto-detection

5. **Algorithm Support & Data Handling**
   - **Classification**: Logistic Regression, Random Forest, Decision Tree, SVM
   - **Regression**: Linear Regression, Random Forest, Decision Tree, SVR, XGBoost
   - Automated class imbalance detection for classification
   - SMOTE (Synthetic Minority Over-sampling Technique) and stratified splitting for robust modeling
   - Automatic feature scaling for algorithms that require it
   - Model training with real-time logs and progress indicators

6. **Model Evaluation & Comparison**
   - Performance metrics display (Accuracy, Precision, Recall, F1, ROC AUC, Log Loss for Classification; R², MAE, RMSE, MAPE for Regression)
   - Auto-adjustment of primary evaluation metric (e.g., forcing F1 instead of Accuracy on imbalanced datasets)
   - Interactive visualizations (confusion matrix, ROC curves, feature importance)
   - Side-by-side model comparison table
   - **Validate on Unseen Data**: Test best models securely against distinct validation sets, manual feature inputs, or external CSVs
   - Best model recommendation based on task-appropriate metrics
**Phase 3: Data Visualization Studio (Days 21-28)**
**Priority: P0 (Must Have)**

7. **Dataset Visualization (Pre-Training)**
   - Distribution histograms for numeric columns
   - Box plots showing outliers, quartiles, and spread
   - Correlation heatmap showing feature relationships
   - Null pattern matrix visualizing where missing values exist
   - Value count bar charts for categorical columns
   - Interactive scatter plots with user-selectable axes
   - Pair plot grid for small datasets (<10 features)
   - Data type proportion pie chart

8. **Training Metrics Visualization (Post-Training)**
   - Confusion matrix heatmap (classification)
   - ROC curves with AUC per model (classification)
   - Precision-recall curves (classification)
   - Feature importance bar charts (all models)
   - Residual plots (regression)
   - Actual vs predicted scatter plots (regression)
   - Learning curves (training vs validation over data size)
   - Model comparison radar/spider charts
   - Training time comparison bar chart

**Phase 4: Enhanced Features (Days 39-42)**
**Priority: P1 (Should Have)**

13. **Export & Download Capabilities**
    - Download cleaned dataset (CSV)
    - Download filtered preview data
    - Export model predictions
    - Save model configuration

14. **User Experience Enhancements**
    - Interactive background animations
    - Toast notifications for operations
    - Loading states and progress bars
    - Responsive mobile design
    - Keyboard shortcuts guide

**Phase 5: Advanced Features (Optional - Post-MVP)**
**Priority: P2 (Nice to Have)**

15. **Advanced ML Capabilities**
    - Hyperparameter tuning interface
    - Cross-validation options
    - Ensemble model creation
    - Feature engineering suggestions

16. **Collaboration & Persistence**
    - Save/load project sessions
    - User authentication with persistent XP/progress
    - Project sharing capabilities
    - Dataset version control

17. **Extended Format Support**
    - JSON data import
    - Database connections
    - API data ingestion

---

### Target Users / Personas

**Primary Persona: Business Analyst (Sarah)**

- **Demographics:**
  - Age: 28-45
  - Location: Urban areas, India/Global
  - Occupation: Business Analyst, Data Analyst, Marketing Analyst
  - Tech Savviness: Medium (comfortable with Excel, BI tools; limited coding)

- **Goals & Motivations:**
  - Derive actionable insights from business data without relying on data science teams
  - Build predictive models for customer churn, sales forecasting, demand prediction
  - Validate hypotheses quickly to inform strategic decisions
  - Learn ML concepts to advance career into data science

- **Pain Points:**
  - Waiting weeks for data science team to build simple models
  - Frustrated by Python/R learning curve when attempting self-service
  - Difficulty explaining technical ML requirements to engineers
  - No visibility into model selection rationale

- **User Needs:**
  - Intuitive interface with clear guidance at each step
  - Explanations of what each cleaning operation and algorithm does
  - Fast iteration cycles (upload → clean → train → results in minutes)
  - Ability to export results for presentation to stakeholders

---

**Secondary Persona: Computer Science Student (Raj)**

- **Demographics:**
  - Age: 18-24
  - Location: College/University, primarily India
  - Occupation: Undergraduate/Graduate CS student
  - Tech Savviness: High (knows programming basics, learning ML/AI)

- **Goals & Motivations:**
  - Complete ML course assignments and projects efficiently
  - Understand practical ML workflow beyond theoretical lectures
  - Build portfolio projects to showcase during job interviews
  - Experiment with different algorithms to learn their behavior

- **Pain Points:**
  - Setting up Python environments and managing dependencies is time-consuming
  - Spending hours debugging data preprocessing code instead of learning ML concepts
  - Limited computing resources for running models on personal laptop
  - Difficulty visualizing algorithm performance differences

- **User Needs:**
  - Educational tooltips explaining ML terminology and concepts
  - Fast experimentation with multiple algorithms
  - Clear visualizations showing why one model outperforms another
  - Example datasets to learn with before using own data

---

**Tertiary Persona: Data Scientist (Priya)**

- **Demographics:**
  - Age: 26-38
  - Location: Tech hubs (Bangalore, Mumbai, Hyderabad, Global)
  - Occupation: Data Scientist, ML Engineer
  - Tech Savviness: Very High (expert in Python, ML frameworks)

- **Goals & Motivations:**
  - Rapidly prototype models before investing time in production code
  - Demonstrate proof-of-concept to stakeholders with minimal effort
  - Automate repetitive data cleaning tasks that don't require custom logic
  - Benchmark baseline model performance before advanced techniques

- **Pain Points:**
  - Writing boilerplate data cleaning and model training code repeatedly
  - Time pressure to show results quickly during exploratory phase
  - Need to explain ML concepts to non-technical stakeholders

- **User Needs:**
  - Speed and efficiency for common workflows
  - Ability to download cleaned data and continue in Jupyter notebooks
  - Accurate baseline models with proper validation
  - Export capabilities to integrate with existing workflows

---

**Quaternary Persona: Complete Beginner (Aarav)**

- **Demographics:**
  - Age: 16-22
  - Location: Schools/Colleges, primarily India and developing countries
  - Occupation: High school or first-year college student, career changers
  - Tech Savviness: Low (basic computer skills, no coding or data science experience)

- **Goals & Motivations:**
  - Understand what machine learning is and how it works
  - Get hands-on experience without needing to learn programming first
  - Build school/college projects to impress teachers and peers
  - Explore data science as a potential career path
  - Feel confident discussing ML concepts in interviews or conversations

- **Pain Points:**
  - Overwhelmed by ML terminology (features, labels, overfitting, precision)
  - Intimidated by Jupyter notebooks, Python, and command-line tools
  - No guidance on where to start — YouTube tutorials are too fragmented
  - Fear of making mistakes or "breaking something"
  - Existing ML tools assume prior knowledge and offer no learning path

- **User Needs:**
  - Step-by-step guided learning with visual explanations and animations
  - A safe "sandbox" environment where mistakes have no consequences
  - Interactive quizzes to verify understanding before moving forward
    - Pre-loaded sample datasets so they don't need to find data themselves
  - Jargon-free language with "What does this mean?" tooltips everywhere

---

## Data Visualization Studio

The Data Visualization Studio is a comprehensive charting and analysis toolkit woven throughout ML Yantra, enabling users to visually understand their data before, during, and after model training. Visualization is accessible both as a dedicated tab within the Clean page and as the core of the Results page.

### Dataset Visualization (Pre-Training)

Available on the **Clean page** after uploading data — embedded as a "Visualize" tab within cleaning operations.

#### Chart Types

| Chart | Purpose | Data Requirement | Interactivity |
|-------|---------|-----------------|---------------|
| **Distribution Histogram** | Show value spread, skewness, and modality per column | Any numeric column | Click bins for count, adjust bin size slider |
| **Box Plot** | Show median, quartiles, whiskers, and outliers | Any numeric column | Hover outlier points for exact value |
| **Correlation Heatmap** | Show Pearson correlation between all numeric features | ≥2 numeric columns | Click cell for scatter plot of that pair |
| **Null Pattern Matrix** | Visualize location and patterns of missing data | When dataset has nulls | Toggle column visibility, sort by null density |
| **Value Count Bar Chart** | Show frequency of each category | Any categorical column | Click bar to filter dataset to that category |
| **Scatter Plot** | Show relationship between two variables | User selects X and Y axes | Zoom, pan, color by third column |
| **Pair Plot Grid** | Show all pairwise scatter plots | ≤10 numeric features | Click any subplot to expand |
| **Data Type Pie Chart** | Show proportion of numeric vs categorical vs datetime | Always available | Click slice for column list |

#### Dataset Visualization Component: `DataVizPanel`

```
┌──────────────────────────────────────────────────────────────┐
│  📊 Data Visualization                                       │
├──────────────────────────────────────────────────────────────┤
│  [Histogram] [Box Plot] [Correlation] [Nulls] [Scatter] ... │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Column: [▼ Select Column]    Bin Size: [━━━●━━━]           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │                                                    │      │
│  │          ▐█▌                                       │      │
│  │         ▐██▌                                       │      │
│  │        ▐███▌  ▐█▌                                  │      │
│  │   ▐█▌ ▐████▌ ▐██▌ ▐█▌                             │      │
│  │  ▐██▌ ▐█████▌▐███▌▐██▌ ▐█▌                        │      │
│  │  ▐███▌▐██████████████▌ ▐██▌ ▐█▌                   │      │
│  │──────────────────────────────────────              │      │
│  │  0    50   100   150   200   250   300             │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
│  📊 Statistics: Mean=142.3 | Median=130 | Std=58.2          │
│  📈 Distribution: Right-skewed | Outliers: 3 detected       │
│                                                              │
│  💡 "This column shows a right-skewed distribution.          │
│      Consider log transformation before training."           │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Auto-suggestion:** When user opens Visualize tab, auto-generates the most useful charts based on column types
- **AI Insights:** Below each chart, the AI assistant provides a plain-English interpretation (e.g., "Price has 3 clear outliers above ₹2M. Consider capping or removing them.")
- **Export:** Each chart can be downloaded as PNG/SVG

#### Backend API Endpoints

```
GET /visualize/distribution/{session_id}?column={name}&bins={count}
    → Returns: { bins: [{start, end, count}], stats: {mean, median, std, skew} }

GET /visualize/correlation/{session_id}
    → Returns: { matrix: [[float]], columns: [string], insights: [string] }

GET /visualize/nulls-pattern/{session_id}
    → Returns: { pattern: [[0|1]], columns: [string], null_counts: {col: count} }

GET /visualize/value-counts/{session_id}?column={name}&top_n={count}
    → Returns: { values: [{value, count, percentage}] }

GET /visualize/scatter/{session_id}?x={col1}&y={col2}&color={col3}
    → Returns: { points: [{x, y, color?}], correlation: float }

GET /visualize/boxplot/{session_id}?column={name}
    → Returns: { min, q1, median, q3, max, outliers: [float], iqr }

GET /visualize/pairplot/{session_id}?columns={col1,col2,...}
    → Returns: { plots: [{x_col, y_col, points: [{x, y}]}] }
```

---

### Training Metrics Visualization (Post-Training)

Available on the **Results page** after model training completes.

#### Chart Types

| Chart | Problem Type | Purpose | Interactivity |
|-------|-------------|---------|---------------|
| **Confusion Matrix Heatmap** | Classification | Show TP, TN, FP, FN per class with color intensity | Hover cell for count + percentage |
| **ROC Curve** | Classification | Show TPR vs FPR trade-off, AUC per model | Overlay multiple models, hover for threshold |
| **Precision-Recall Curve** | Classification | Show precision vs recall trade-off | Compare models, identify optimal threshold |
| **Feature Importance Bar Chart** | Both | Rank features by contribution to prediction | Sort ascending/descending, filter top N |
| **Residual Plot** | Regression | Show prediction errors (actual - predicted) | Hover for exact values, identify patterns |
| **Actual vs Predicted Scatter** | Regression | Show how close predictions are to reality | Perfect diagonal reference line, R² display |
| **Learning Curves** | Both | Show training vs validation score over data size | Detect overfitting/underfitting visually |
| **Model Comparison Radar** | Both | Spider chart comparing all metrics across models | Toggle models on/off |
| **Training Time Bar Chart** | Both | Compare algorithm training speeds | Sort by time, hover for exact duration |

#### Training Visualization Component: `TrainingVizPanel`

```
┌──────────────────────────────────────────────────────────────┐
│  📈 Model Evaluation Visualizations                          │
├──────────────────────────────────────────────────────────────┤
│  [Confusion Matrix] [ROC Curves] [Feature Importance]        │
│  [Residuals] [Learning Curves] [Model Comparison]            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Model: [▼ Random Forest]    Compare with: [▼ All Models]   │
│                                                              │
│  ┌──────────────────────────────────────────────────┐        │
│  │              Confusion Matrix                     │        │
│  │         Predicted: No    Predicted: Yes           │        │
│  │  Actual: No   [  85  ]   [   5  ]                │        │
│  │  Actual: Yes  [   3  ]   [  47  ]                │        │
│  │                                                   │        │
│  │  Accuracy: 94.3% | Precision: 90.4%              │        │
│  │  Recall: 94.0%   | F1 Score: 92.2%               │        │
│  └──────────────────────────────────────────────────┘        │
│                                                              │
│  💡 "Random Forest correctly classified 94.3% of samples.    │
│      The 3 false negatives may indicate the model is         │
│      slightly conservative. Consider adjusting threshold."   │
└──────────────────────────────────────────────────────────────┘
```

#### Backend API Endpoints

```
GET /results/{training_id}/confusion-matrix?model_id={id}
    → Returns: { matrix: [[int]], labels: [string], metrics: {accuracy, precision, recall, f1} }

GET /results/{training_id}/roc-curve
    → Returns: { models: [{name, fpr: [float], tpr: [float], auc: float}] }

GET /results/{training_id}/precision-recall
    → Returns: { models: [{name, precision: [float], recall: [float], ap: float}] }

GET /results/{training_id}/feature-importance?model_id={id}
    → Returns: { features: [{name, importance: float}], sorted: true }

GET /results/{training_id}/residuals?model_id={id}
    → Returns: { points: [{predicted, residual, actual}] }

GET /results/{training_id}/actual-vs-predicted?model_id={id}
    → Returns: { points: [{actual, predicted}], r2: float, rmse: float }

GET /results/{training_id}/learning-curve?model_id={id}
    → Returns: { train_sizes: [int], train_scores: [float], val_scores: [float] }

GET /results/{training_id}/comparison-radar
    → Returns: { models: [{name, metrics: {accuracy, precision, recall, f1, speed}}] }
```

---

## Multi-Sheet Excel Workspace

ML Yantra supports uploading Excel files with multiple sheets, enabling users to work with complex, multi-table datasets. Each sheet becomes an independent workspace, and users can merge sheets using various strategies.

### Features

| Feature | Description |
|---------|-------------|
| **Multi-format Upload** | Accepts `.csv`, `.xlsx`, `.xls` files up to 100MB |
| **Sheet Detection** | Automatically detects all sheets in an Excel file |
| **Per-sheet Workspace** | Each sheet gets its own session — independent data preview, statistics, and cleaning operations |
| **Sheet Tabs** | Tab bar at the top of the Clean page for switching between sheets |
| **Sheet Merging** | Combine multiple sheets into one using three strategies |

### Merge Strategies

| Strategy | Direction | Use Case | Details |
|----------|-----------|----------|---------|
| **Concatenate Rows** | Vertical (↓) | Same column structure, different data rows | Stacks rows. Missing columns filled with NULL. |
| **Concatenate Columns** | Horizontal (→) | Different features, same observations | Places columns side-by-side. Ideally same row count. |
| **Join (SQL-style)** | On shared key column | Related data in different sheets | Supports inner, outer, left, right joins on a selected common column. |

### Merge UI Flow

1. Click **"Merge Sheets"** button on the sheet tab bar
2. Select 2+ sheets via checkboxes
3. Choose merge type (radio buttons with descriptions + disclaimers)
4. If "Join" selected: pick join column from common columns dropdown + join type
5. Review **disclaimer** explaining exactly what will happen:
   - "Data will be merged **row-wise (vertically)**. Rows from all selected sheets will be stacked."
   - "Data will be merged using an **inner join** on column 'car_name'. Only matching rows will be kept."
6. Click **Merge** → new session created with merged dataset
7. Merged dataset appears as a new tab: "Merged (Sheet1 + Sheet2)"

### API Endpoints

```
POST /upload
    → Accepts: multipart/form-data (CSV or Excel)
    → Returns: { session_id, is_multi_sheet, group_id?, sheets: [{sheet_name, session_id, rows, columns, column_names, column_types}] }

GET /sheets/{group_id}
    → Returns: { group_id, sheets: [{sheet_name, session_id, rows, columns, column_names, column_types}] }

GET /sheets/{group_id}/common-columns?sheet_names={name1,name2}
    → Returns: { common_columns, all_columns, unique_columns, sheets_have_same_columns }

POST /merge
    → Body: { group_id, sheet_names, merge_type, on_column?, how? }
    → Returns: { session_id, rows, columns, column_names, column_types, message }
```

---

## Branding, Theming & Visual Identity

### Brand Identity

**Brand Name:** ML Yantra

**Brand Personality:**
- **Tone:** Educational yet Professional, Warm & Approachable, AI-Enhanced
- **Voice:** Clear, Guiding, Encouraging, Confidence-building, Intelligent
- **Mood:** Modern & Innovative (cutting-edge SaaS) + Energetic & Warm (learning platform with AI mentor)

**Brand Values:**
- **Democratization** - Making advanced ML accessible to everyone with AI-powered guidance
- **Empowerment** - Giving users the tools, knowledge, and intelligent suggestions to solve problems independently
- **Transparency** - Showing users what happens at each step with AI explanations, building understanding and trust
- **Innovation** - Using modern technology and AI to create delightful, intuitive, efficient user experiences

**Brand Story:**
ML Yantra ("Yantra" means "machine" or "instrument" in Sanskrit) was created to break down the barriers preventing talented professionals from leveraging machine learning. We believe that domain expertise combined with accessible ML tools can unlock insights that pure technical skill alone cannot achieve. ML Yantra guides users through their ML journey, teaching while doing, empowering everyone from students to analysts to data scientists to work faster and smarter.

---

### Logo & Visual Assets

**Logo Specifications:**
- **Primary Logo:** "ML Yantra" wordmark with geometric icon (gear/circuit fusion representing machine learning)
- **Logo Variations:** 
  - Full logo with icon + wordmark (primary use)
  - Icon-only (app favicon, small spaces)
  - Wordmark-only (text-constrained areas)
  - Light mode version (dark text) and dark mode version (light text)
- **Safe Space:** Minimum clear space = height of "M" letter on all sides
- **Minimum Size:** 120px width for full logo, 32px for icon-only
- **File Formats:** SVG (primary), PNG (fallback), WebP (optimized)

**Imagery Style:**
- **Photography:** Clean, modern workspace images; diverse people collaborating with data
- **Illustrations:** Isometric data visualizations, abstract representations of ML concepts (neural networks, decision trees)
- **Icons:** Google Material Symbols - Rounded variant (friendly, modern, consistent)
- **Patterns/Textures:** Subtle grid patterns, data point scatter backgrounds (low opacity), gradient mesh overlays

---

### Color System (OKLCH)

**Understanding OKLCH:**
OKLCH is a perceptual color space that provides:
- **L (Lightness):** 0-100% (0 = black, 100 = white)
- **C (Chroma):** 0-0.4 (0 = grayscale, higher = more vibrant)
- **H (Hue):** 0-360 degrees (color wheel position)

**Color Palette Definition:**

#### Primary Brand Color (Vibrant Orange)
```css
--color-primary: oklch(65% 0.20 40);
--color-primary-content: oklch(98% 0.01 40);
```

**Example:** `oklch(65% 0.20 40)` - Energetic, warm orange
- **Usage:** Primary CTAs, navigation active states, links, key actions, gradient start
- **Meaning:** Energy, creativity, warmth, innovation, approachability
- **Accessibility:** Contrast ratio with base-100: 5.8:1 (AA)

**Color Variations:**
- Lighter: `oklch(75% 0.16 40)` - Hover states, selected backgrounds
- Darker: `oklch(55% 0.22 40)` - Active states, emphasis, depth

---

#### Secondary Brand Color (Rose Pink)
```css
--color-secondary: oklch(70% 0.18 350);
--color-secondary-content: oklch(98% 0.01 350);
```

**Example:** `oklch(70% 0.18 350)` - Vibrant rose pink
- **Usage:** Secondary CTAs, highlights, AI suggestions, gradient end, warm accents
- **Meaning:** Creativity, innovation, playfulness, intelligent assistance
- **Accessibility:** Contrast ratio with base-100: 5.2:1 (AA)

---

#### Accent Color (Gradient Mid-tone - Coral)
```css
--color-accent: oklch(68% 0.19 20);
--color-accent-content: oklch(98% 0.01 20);
```

**Example:** `oklch(68% 0.19 20)` - Gradient middle coral
- **Usage:** AI assistant highlights, special features, badges, notifications, gradient transitions
- **Meaning:** Intelligence, warmth, guidance, AI-powered insights
- **Accessibility:** Contrast ratio with base-100: 5.5:1 (AA)

---

#### Neutral Colors
```css
--color-neutral: oklch(30% 0.02 250);
--color-neutral-content: oklch(95% 0.01 250);
```

**Example:** `oklch(30% 0.02 250)` - Cool dark gray
- **Usage:** Text, borders, dividers, subtle UI elements, disabled states
- **Meaning:** Foundation, stability, readability

---

#### Base Colors (Backgrounds & Surfaces)
```css
--color-base-100: oklch(98% 0.005 250);  /* Main background - near white with cool tint */
--color-base-200: oklch(94% 0.01 250);   /* Cards, panels - soft gray */
--color-base-300: oklch(88% 0.015 250);  /* Borders, dividers - medium gray */
--color-base-content: oklch(20% 0.015 250); /* Primary text - dark gray-blue */
```

**Example (Light Theme):**
```css
--color-base-100: oklch(98% 0.005 250); /* Clean, bright background */
--color-base-200: oklch(94% 0.01 250);  /* Subtle elevation for cards */
--color-base-300: oklch(88% 0.015 250); /* Clear visual separation */
--color-base-content: oklch(20% 0.015 250); /* Readable, high-contrast text */
```

---

#### Semantic Colors

**Info:**
```css
--color-info: oklch(60% 0.18 240); /* Blue for informational */
--color-info-content: oklch(98% 0.01 0);
```
- **Usage:** Info messages, help text, tooltips, educational callouts

**Success:**
```css
--color-success: oklch(65% 0.20 145); /* Fresh green for success */
--color-success-content: oklch(15% 0.05 145);
```
- **Usage:** Success messages, completed operations, model training complete, data saved

**Warning:**
```css
--color-warning: oklch(75% 0.18 85); /* Amber for warnings */
--color-warning-content: oklch(20% 0.05 85);
```
- **Usage:** Warning messages, data quality issues, missing values alert, confirmation prompts

**Error:**
```css
--color-error: oklch(60% 0.22 25); /* Clear red for errors */
--color-error-content: oklch(98% 0.01 0);
```
- **Usage:** Error messages, validation failures, operation failed, destructive actions

---

### Color Usage Guidelines

**Do's:**
- ✅ Use primary orange for main CTAs and important actions (Get Started, Train Model, Apply Changes)
- ✅ Use secondary pink for AI suggestions, highlights, and supportive actions
- ✅ Use accent coral for gradient transitions and special features
- ✅ Create orange-to-pink gradients for backgrounds, buttons, and hero sections
- ✅ Use semantic colors consistently (green = success, red = error, amber = warning, blue = info)
- ✅ Ensure all text meets WCAG 2.1 AA contrast requirements (4.5:1 minimum)
- ✅ Use base-200 for card backgrounds to create subtle depth
- ✅ Test gradient overlays for text readability

**Don'ts:**
- ❌ Don't overuse gradients (reserve for hero sections, CTAs, highlights)
- ❌ Don't place text directly on gradients without ensuring contrast
- ❌ Don't use color as the only indicator (add icons + text labels)
- ❌ Don't override semantic color meanings (never use red for success)
- ❌ Don't use low-contrast color combinations
- ❌ Don't use pure black (#000000) for text (use base-content instead)

**Gradient Usage:**
```css
/* Primary gradient (orange to pink) */
.bg-gradient-primary {
  background: linear-gradient(135deg, 
    oklch(65% 0.20 40) 0%,    /* Orange */
    oklch(68% 0.19 20) 50%,   /* Coral */
    oklch(70% 0.18 350) 100%  /* Pink */
  );
}

/* Subtle gradient for large areas */
.bg-gradient-subtle {
  background: linear-gradient(135deg, 
    oklch(98% 0.01 40) 0%,
    oklch(98% 0.01 350) 100%
  );
}

/* Button gradient */
.btn-gradient {
  background: linear-gradient(135deg,
    oklch(65% 0.20 40),
    oklch(70% 0.18 350)
  );
  color: oklch(98% 0.01 0);
}
```

---

### Color Accessibility Matrix

| Text Color | Background | Contrast Ratio | WCAG Level | Use Case |
|------------|------------|----------------|------------|----------|
| base-content | base-100 | 11.2:1 | AAA | Body text |
| base-content | base-200 | 9.8:1 | AAA | Card text |
| primary-content | primary | 10.5:1 | AAA | Primary buttons |
| secondary-content | secondary | 8.1:1 | AAA | Secondary buttons |
| accent-content | accent | 9.2:1 | AAA | Accent buttons |
| error-content | error | 10.1:1 | AAA | Error messages |
| success-content | success | 9.5:1 | AAA | Success messages |

**Testing Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [OKLCH Color Picker](https://oklch.com/)
- Browser DevTools Accessibility Panel

---

### Visual Hierarchy & Emphasis

**Color-Based Hierarchy:**
1. **Primary Actions:** Primary blue (highest visual weight) - "Train Model", "Upload Dataset"
2. **Secondary Actions:** Secondary coral or neutral outline - "Download Data", "Preview"
3. **Tertiary Actions:** Ghost or link style - "Cancel", "Reset"
4. **Text Hierarchy:** 
   - base-content (primary text - headings, labels)
   - base-content/80 (secondary text - descriptions)
   - base-content/60 (tertiary text - metadata, timestamps)

**Example Color Application:**
```tsx
{/* Primary CTA */}
<button className="btn btn-primary">Train Model</button>

{/* Secondary action */}
<button className="btn btn-secondary">Download Data</button>

{/* Tertiary action */}
<button className="btn btn-ghost">Cancel</button>

{/* Text hierarchy */}
<h2 className="text-base-content text-2xl font-semibold">Model Training</h2>
<p className="text-base-content/80 text-base">Select features and configure your model</p>
<span className="text-base-content/60 text-sm">Last trained: 5 minutes ago</span>
```

---

## UI/UX Design System

### Design Principles

- **Consistency:** Maintain visual and behavioral consistency across all pages using reusable components from the DaisyUI system and custom component library
- **Accessibility:** Design with accessibility-first approach, ensuring WCAG 2.1 AA compliance minimum with semantic HTML, ARIA labels, keyboard navigation, and screen reader support
- **Responsiveness:** Mobile-first responsive approach with breakpoints at 640px (mobile), 768px (tablet), 1024px (laptop), 1280px (desktop)
- **Modularity:** Component composition philosophy using atomic design (atoms → molecules → organisms → templates → pages)
- **Reusability:** DRY principles with shared components, utilities, and hooks to minimize code duplication

---

### DaisyUI 5 Theme Configuration

**Complete Theme Definition:**

```css
@plugin "daisyui/theme" {
  name: "ml-yantra-gradient";
  default: true;
  prefersdark: false;
  color-scheme: "light";
  
  /* Base Colors */
  --color-base-100: oklch(98% 0.005 40);   /* Main background with warm tint */
  --color-base-200: oklch(96% 0.008 40);   /* Cards, panels */
  --color-base-300: oklch(92% 0.012 40);   /* Borders, dividers */
  --color-base-content: oklch(20% 0.015 40); /* Text color */
  
  /* Primary Brand Color - Vibrant Orange */
  --color-primary: oklch(65% 0.20 40);
  --color-primary-content: oklch(98% 0.01 40);
  
  /* Secondary Brand Color - Rose Pink */
  --color-secondary: oklch(70% 0.18 350);
  --color-secondary-content: oklch(98% 0.01 350);
  
  /* Accent Color - Coral (gradient mid-tone) */
  --color-accent: oklch(68% 0.19 20);
  --color-accent-content: oklch(98% 0.01 20);
  
  /* Neutral Color */
  --color-neutral: oklch(30% 0.02 40);
  --color-neutral-content: oklch(95% 0.01 40);
  
  /* Semantic Colors */
  --color-info: oklch(60% 0.18 240);
  --color-info-content: oklch(98% 0.01 0);
  --color-success: oklch(65% 0.20 145);
  --color-success-content: oklch(15% 0.05 145);
  --color-warning: oklch(75% 0.18 85);
  --color-warning-content: oklch(20% 0.05 85);
  --color-error: oklch(60% 0.22 25);
  --color-error-content: oklch(98% 0.01 0);
  
  /* Border Radius */
  --radius-selector: 0.5rem;  /* Radio buttons, checkboxes */
  --radius-field: 0.5rem;     /* Input fields */
  --radius-box: 1rem;         /* Cards, containers */
  
  /* Sizing */
  --size-selector: 1.5rem;
  --size-field: 2.5rem;
  
  /* Effects */
  --border: 1px;
  --depth: 3;     /* Shadow depth - subtle elevation */
  --noise: 0;     /* No noise texture for clean look */
}
```

**Theme Application in Code:**

```tsx
// In your HTML
<html data-theme="ml-yantra-gradient">

// Component usage with gradients
<button className="btn bg-gradient-to-r from-primary to-secondary text-primary-content">
  Train Model
</button>

<div className="hero bg-gradient-to-br from-primary via-accent to-secondary">
  <div className="hero-content">Content with gradient background</div>
</div>

<div className="card bg-base-100 shadow-lg">
  <div className="card-body">Content</div>
</div>
```

---

### Typography

**Google Fonts Integration:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Font System:**

**Primary Font (Headings):**

- **Font Family:** Space Grotesk
- **Weights:** 400, 500, 600, 700
- **Usage:** Headings (H1-H6), hero text, section titles, feature highlights
- **Characteristics:** Modern, geometric, technical yet approachable, excellent for data-focused interfaces

**Secondary Font (Body):**

- **Font Family:** Inter
- **Weights:** 300, 400, 500, 600, 700, 800
- **Usage:** Body text, paragraphs, descriptions, UI labels, buttons, form inputs
- **Characteristics:** Highly readable, neutral, optimized for UI, excellent screen legibility

**Typography Scale:**

```css
/* Heading Styles */
H1: 48px / 56px - font-weight: 700 (Space Grotesk Bold)
H2: 36px / 44px - font-weight: 600 (Space Grotesk Semi-Bold)
H3: 28px / 36px - font-weight: 600 (Space Grotesk Semi-Bold)
H4: 24px / 32px - font-weight: 500 (Space Grotesk Medium)
H5: 20px / 28px - font-weight: 500 (Space Grotesk Medium)
H6: 18px / 26px - font-weight: 500 (Space Grotesk Medium)

/* Body Styles */
Body Large: 18px / 28px - font-weight: 400 (Inter Regular)
Body Regular: 16px / 24px - font-weight: 400 (Inter Regular)
Body Small: 14px / 20px - font-weight: 400 (Inter Regular)

/* UI Elements */
Button Text: 16px / 24px - font-weight: 600 (Inter Semi-Bold)
Label: 14px / 20px - font-weight: 500 (Inter Medium)
Caption: 12px / 16px - font-weight: 400 (Inter Regular)
```

**Responsive Typography:**

- Mobile (<768px): H1 = 36px, H2 = 28px, Body = 16px
- Tablet (768-1023px): H1 = 42px, H2 = 32px, Body = 16px
- Desktop (≥1024px): Full sizes as defined above

---

### Icons - Google Material Symbols

**Integration:**

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0" rel="stylesheet">
```

**Icon Variant:** Rounded (friendly, modern, approachable)

**Icon Usage:**

| Category | Icon Names |
|----------|-----------|
| **Navigation** | home, arrow_back, arrow_forward, menu, close, chevron_left, chevron_right, expand_more, expand_less |
| **Actions** | upload_file, download, save, delete, edit, refresh, undo, redo, copy, check, add, remove |
| **Data Operations** | cleaning_services, filter_list, sort, search, visibility, visibility_off, info, help |
| **ML/Training** | model_training, psychology, analytics, assessment, speed, tune, science |
| **Status** | check_circle, error, warning, pending, done_all, sync, cloud_done |
| **Charts/Data** | bar_chart, show_chart, pie_chart, table_chart, leaderboard, monitoring |
| **File/Data** | description, folder, dataset, storage, database |
| **User** | person, account_circle, settings, logout |

**Icon Sizes:**

- Small: 18px (inline with small text, table cells)
- Medium: 20px (buttons, UI elements, form labels)
- Large: 24px (prominent actions, page headers)
- XL: 32px (feature icons, empty states, hero sections)

**Icon Component:**

```tsx
interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ariaLabel?: string;
}

const Icon = ({ name, size = 'md', className = '', ariaLabel }: IconProps) => {
  const sizes = {
    sm: 'text-lg',  // 18px
    md: 'text-xl',  // 20px
    lg: 'text-2xl', // 24px
    xl: 'text-4xl', // 32px
  };
  
  return (
    <span
      className={`material-symbols-rounded ${sizes[size]} ${className}`}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      {name}
    </span>
  );
};
```

---

### Responsive Design

**Breakpoint System:**

```tsx
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large desktops
};
```

**Layout Patterns:**

**Desktop (≥1280px):**

- Multi-column layouts (sidebar + main content, 3-column grids)
- Full navigation bar with all links visible
- Side-by-side comparison views for models
- Large data tables with all columns
- Tooltips on hover

**Tablet (768px - 1279px):**

- 2-column layouts (stacked for data cleaning operations)
- Collapsible sidebar navigation
- Touch-friendly elements (min 44px tap targets)
- Moderate spacing (16px-24px)
- Horizontal scrolling for wide tables

**Mobile (<768px):**

- Single column stacked layout
- Hamburger menu navigation
- Full-width buttons and cards
- Optimized touch targets (min 48px)
- Accordion-style sections for data operations
- Bottom navigation for key actions

**Responsive Utilities:**

```tsx
/* Grid Layout */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

/* Typography */
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">

/* Spacing */
<section className="py-8 md:py-12 lg:py-16 px-4 md:px-6 lg:px-8">

/* Visibility */
<div className="block md:hidden">Mobile only - Hamburger menu</div>
<div className="hidden md:block">Desktop only - Full navigation</div>

/* Component sizing */
<button className="btn btn-sm md:btn-md lg:btn-lg">
```

---

### Accessibility Requirements

**WCAG 2.1 AA Compliance Checklist:**

**Perceivable:**

- [ ] All images have descriptive alt text (charts, feature icons, illustrations)
- [ ] Color contrast ratio ≥ 4.5:1 for normal text (body, labels)
- [ ] Color contrast ratio ≥ 3:1 for large text (headings 18pt+)
- [ ] Color is not the only indicator (icons + text for status, errors use icon + color + text)
- [ ] Text can be resized up to 200% without loss of content or functionality
- [ ] Charts include text labels and patterns in addition to colors

**Operable:**

- [ ] All functionality available via keyboard (Tab, Enter, Space, Arrow keys)
- [ ] No keyboard traps (modals can be closed with ESC, focus returns properly)
- [ ] Focus indicator is clearly visible (2px outline, high contrast)
- [ ] Skip navigation link provided ("Skip to main content")
- [ ] Clear, descriptive page titles (`<title>ML Yantra - Data Cleaning</title>`)
- [ ] Logical focus order (left-to-right, top-to-bottom)
- [ ] Keyboard shortcuts don't override browser/AT shortcuts

**Understandable:**

- [ ] Language of page declared (`<html lang="en">`)
- [ ] Consistent navigation across pages (same navbar, same layout)
- [ ] Input assistance for forms (labels, placeholders, error messages, helper text)
- [ ] Error identification and suggestions ("Email is required", "Select at least one feature")
- [ ] Labels and instructions provided before form inputs

**Robust:**

- [ ] Valid HTML (no parsing errors, proper nesting)
- [ ] ARIA used correctly (roles, states, properties, landmarks)
- [ ] Name, role, value for all UI components (buttons, inputs, custom controls)
- [ ] Status messages announced to screen readers (aria-live for toast notifications)

---

## Component Design System

### Component Organization Structure

```
src/
├── components/
│   ├── atoms/              # Basic UI elements
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Badge/
│   │   ├── Icon/
│   │   ├── Spinner/
│   │   ├── Checkbox/
│   │   ├── Radio/
│   │   ├── Slider/
│   │   └── Tooltip/
│   │
│   ├── molecules/          # Combinations of atoms
│   │   ├── FormField/
│   │   ├── Card/
│   │   ├── StatCard/
│   │   ├── Toast/
│   │   ├── Modal/
│   │   ├── Dropdown/
│   │   ├── OperationCard/
│   │   └── MetricDisplay/
│   │
│   ├── organisms/          # Complex UI sections
│   │   ├── Navbar/
│   │   ├── Footer/
│   │   ├── DataPreview/
│   │   ├── OperationPanel/
│   │   ├── ModelSelector/
│   │   ├── MetricsPanel/
│   │   ├── VisualizationPanel/
│   │   ├── DataVizPanel/          # NEW: Dataset visualization charts
│   │   ├── TrainingVizPanel/      # NEW: Training metrics charts
│   │   ├── HistoryTimeline/
│   │   ├── FileUploader/
│   │   ├── SheetWorkspace/        # NEW: Multi-sheet tab bar + merge dialog
│   │   ├── InteractiveSandbox/    # NEW: ML Academy practice playground
│   │   ├── QuizPanel/             # NEW: Interactive quizzes
│   │   ├── ConceptExplainer/      # NEW: Animated ML concept explainers
│   │   └── ProgressDashboard/     # NEW: Learning journey overview
│   │
│   ├── layouts/          # Page-level layouts
│   │   ├── MainLayout/
│   │   ├── CleaningLayout/
│   │   └── TrainingLayout/
│   │
│   └── pages/              # Route-level pages
│       ├── Home/
│       ├── Clean/
│       ├── Train/
│       ├── Results/
│       ├── Learn/               # NEW: ML Academy hub
│       ├── Lesson/              # NEW: Individual lesson view
│       └── Sandbox/             # NEW: Practice sandbox
```

---

### Atom Components Inventory

| Component | Purpose | Key Props | States | Accessibility |
|-----------|---------|-----------|--------|---------------|
| **Button** | Action triggers | variant (primary/secondary/ghost), size, loading, disabled, icon | default, hover, active, focus, loading, disabled | ARIA labels, keyboard accessible, focus visible ring |
| **Input** | Text input | type, value, error, disabled, placeholder, helperText | default, focus, error, disabled | Label association (htmlFor), error announcement (aria-describedby) |
| **Select** | Dropdown selection | options, value, onChange, error, disabled | default, open, focus, error, disabled | Native semantics, keyboard navigation |
| **Badge** | Status indicators | variant (info/success/warning/error), size | default | Role="status" for dynamic updates |
| **Icon** | Material symbols | name, size, color, ariaLabel | default | ARIA hidden or labeled based on context |
| **Spinner** | Loading state | size, color | spinning | Role="status", aria-live="polite" |
| **Checkbox** | Boolean selections | checked, disabled, indeterminate, label | unchecked, checked, indeterminate, disabled | Native input semantics, label association |
| **Radio** | Single selections | checked, disabled, name, value, label | unchecked, checked, disabled | Grouped with fieldset and legend |
| **Slider** | Range input | min, max, value, step, label | default, dragging, focus, disabled | Native range input, value announcement |
| **Tooltip** | Contextual help | content, placement (top/bottom/left/right) | hidden, visible | aria-describedby, role="tooltip" |
| **SkillBadge** | Skill level indicator (ML Academy) | level (rookie/apprentice/practitioner/expert/master), size, animated | default, pulsing | Decorative with aria-hidden, or labeled |
| **XPCounter** | XP display in navbar | currentXP, level, nextLevelXP | default, animating (on XP gain) | aria-live for XP changes |
| **HintButton** | Progressive disclosure hints | hints[], currentLevel | idle, expanded (3 levels) | aria-expanded, keyboard toggle |

---

### Molecule Components Inventory

| Component | Combines | Purpose | Key Props | Accessibility |
|-----------|----------|---------|-----------|---------------|
| **FormField** | Label + Input + Error | Form input with validation | label, name, error, required, helperText | Proper ID associations, error announcement |
| **Card** | Container + Content | Content grouping | title, children, actions, hoverable | Semantic structure (article/section) |
| **StatCard** | Icon + Label + Value | Statistical display | icon, label, value, trend, color | Semantic markup, screen reader friendly |
| **Toast** | Icon + Text + Close | Notifications | variant, message, duration, onClose | aria-live region, dismissible |
| **Modal** | Overlay + Card + Actions | Dialog boxes | isOpen, onClose, title, children, footer | Focus trap, ESC close, aria-modal, return focus |
| **Dropdown** | Button + Menu + Items | Selection/action menu | items, value, onChange, trigger | Keyboard navigation (arrows, enter, esc) |
| **OperationCard** | Icon + Title + Description + Button | Data cleaning operations | operation, description, onApply | Clear action labeling |
| **MetricDisplay** | Label + Value + Chart | Model performance metrics | metricName, value, interpretation | Table structure for screen readers |
| **LessonCard** | Icon + Title + Badge + Progress | ML Academy lesson tiles | title, description, difficulty, xp, completed, locked | Clear status labels, keyboard navigable |
| **ModuleProgress** | Progress Bar + Label + Count | Chapter progress tracking | moduleName, completed, total, color | Progress bar with aria-valuenow |
| **BeforeAfterPreview** | Two tables side-by-side | Operation effect comparison | beforeData, afterData, changedCells | Clearly labeled before/after regions |
| **AchievementToast** | Icon + Title + XP + Animation | Celebration notifications | achievement, xpEarned | aria-live, auto-dismiss |
| **ChallengeCard** | Timer + Objective + Difficulty | Timed challenge tiles | title, objective, timeLimit, difficulty | Time announcements for a11y |
| **WhyTooltip** | Expandable info + Link | ML concept explanation with "Learn More" | concept, explanation, moduleLink | aria-expanded, keyboard toggle |
| **MentorBanner** | Icon + Message + Action | AI Mentor contextual suggestions | message, type, learnMoreLink, dismissible | aria-live, dismissible with ESC |

---

### Organism Components Inventory

| Component | Purpose | Complexity | Key Features | Accessibility |
|-----------|---------|------------|--------------|---------------|
| **Navbar** | Site navigation | Medium | Logo, nav links, responsive menu | Skip link, nav landmark, keyboard focus |
| **Footer** | Site footer | Low | Copyright, links | Footer landmark, semantic links |
| **DataPreview** | Dataset table preview | High | Adjustable rows (slider 1-50), pagination, column info | Table semantics, caption, header cells |
| **OperationPanel** | Data cleaning UI | High | Operation selection, parameter inputs, apply/undo | Form semantics, clear sections |
| **ModelSelector** | Algorithm selection | Medium | Classification/regression tabs, algorithm cards | Radio group for selection |
| **MetricsPanel** | Performance display | Medium | Multiple metrics, comparison, best model highlight | Table/grid structure |
| **VisualizationPanel** | ML charts | High | Confusion matrix, ROC, feature importance, interactive | Alt text, data table alternative |
| **HistoryTimeline** | Operation history | Medium | Chronological list, undo/redo controls | Ordered list, keyboard shortcuts |
| **FileUploader** | Drag-drop upload | Medium | File drop zone, file validation, progress, Excel multi-sheet support | Upload button alternative, status updates |
| **SheetWorkspace** | Multi-sheet tab bar + merge | High | Sheet tabs, merge dialog (concat/join), common column detection | Tab panel semantics, keyboard navigation |
| **DataVizPanel** | Dataset visualization | High | Histograms, box plots, correlation heatmap, null patterns, scatter | Alt text for charts, data table alternatives |
| **TrainingVizPanel** | Training metrics charts | High | Confusion matrix, ROC, feature importance, learning curves, radar | Alt text, interactive tooltips |
| **InteractiveSandbox** | ML Academy playground | High | Dataset selector, all tools, hint system, reset, guided walkthroughs | Same a11y as Clean page tools |
| **QuizPanel** | Interactive quizzes | Medium | Multiple choice, drag-and-drop, instant feedback, score tracking | Keyboard navigation, focus management |
| **ConceptExplainer** | Animated ML concepts | Medium | Step-by-step animations, interactive sliders, visual metaphors | Pause/play controls, text alternatives |
| **ProgressDashboard** | Learning journey overview | Medium | Module cards, XP chart, badges, streak counter | Landmarks, clear hierarchy |

---

### Layout Components (Templates)

| Layout | Purpose | Structure | Use Cases |
|--------|---------|-----------|-----------|
| **MainLayout** | Standard pages | Navbar + Content area + Footer | Home page, general informational pages |
| **CleaningLayout** | Data cleaning workspace | Navbar + Sidebar (operations) + Main (preview) + History panel | Data cleaning page with all operations |
| **TrainingLayout** | Model training workspace | Navbar + Config panel + Training area + Results panel | Model training and evaluation |

---

### Page Components Inventory

| Page | Route | Layout | Key Sections | Purpose |
|------|-------|--------|--------------|---------|
| **HomePage** | `/` | MainLayout | Hero, Features showcase, How it works, CTA | Landing page, introduce platform |
| **CleanPage** | `/clean` | CleaningLayout | File upload, Sheet workspace, Operations tabs, Visualize tab, Data preview, History | Data preparation workflow |
| **TrainPage** | `/train` | TrainingLayout | Feature selection, Model selection, Training config | Model training workflow |
| **ResultsPage** | `/results` | TrainingLayout | Metrics comparison, Training visualizations, Best model, Export | Model evaluation and comparison |
| **LearnPage** | `/learn` | MainLayout | Progress dashboard, Module cards, Sandbox entry, Challenges, Badges | ML Academy learning hub |
| **LessonPage** | `/learn/:moduleId/:lessonId` | MainLayout | Lesson content, Interactive elements, Quiz, XP reward | Individual interactive lesson |
| **SandboxPage** | `/learn/sandbox` | CleaningLayout | Dataset selector, All tools, Hint system, Challenge timer | Practice playground |

---

## Google Stitch Wireframe Structure

### Homepage (`/`)

**Purpose:** Introduce ML Yantra, communicate value proposition, guide users to start

**Layout Type:** Full-width sections, centered content

**Block 1 - Hero Section:**

- **Component Type:** Full-width hero with gradient background
- **Elements:**
  - Main heading (H1): "Machine Learning Without Code"
  - Subheading: "Prepare data and train ML models in minutes, not weeks"
  - Primary CTA button: "Get Started Free" → navigates to `/clean`
  - Secondary button: "See How It Works" → scrolls to features
  - Hero illustration: Isometric data visualization graphic
- **Responsive:** Stack buttons vertically on mobile, reduce hero illustration size

**Block 2 - Features Grid:**

- **Component Type:** 3-column grid (1 column on mobile)
- **Elements:**
  - Feature cards (×3):
    1. Icon: cleaning_services, Title: "Intuitive Data Cleaning", Description: "Handle nulls, duplicates, encoding with visual preview"
    2. Icon: model_training, Title: "Multiple ML Algorithms", Description: "Classification and regression models with auto-scaling"
    3. Icon: analytics, Title: "Comprehensive Metrics", Description: "Compare models with interactive visualizations"
- **Responsive:** Stack vertically on mobile, 2 columns on tablet

**Block 3 - How It Works:**

- **Component Type:** Numbered steps with illustrations
- **Elements:**
  - Section heading: "Three Simple Steps"
  - Step cards (×3):
    1. Upload CSV → Clean Data → Train Models
  - Each with icon, number, title, description
- **Responsive:** Vertical flow on mobile

**Block 4 - CTA Section:**

- **Component Type:** Colored background section (primary gradient)
- **Elements:**
  - Heading: "Ready to build your first model?"
  - Button: "Start Cleaning Data" → `/clean`
- **Background:** Blue-teal gradient

**Navigation:**

- **Entry Points:** Direct URL, search engines, marketing
- **Exit Points:** "Get Started" → Clean page
- **Primary CTA:** "Get Started Free"

---

### Clean Page (`/clean`)

**Purpose:** Upload data, perform cleaning operations, preview changes, manage history

**Layout Type:** Sidebar + Main content + Right panel

**Block 1 - Navbar:**

- **Component Type:** Fixed top navigation
- **Elements:**
  - ML Yantra logo (links to home)
  - Nav links: Clean (active), Train, Results
  - Undo/Redo buttons with keyboard shortcuts hint
- **Responsive:** Hamburger menu on mobile

**Block 2 - File Upload (Initial State):**

- **Component Type:** Centered drop zone
- **Elements:**
  - Drag-drop area with icon (upload_file)
  - Text: "Drag CSV file here or click to browse"
  - File size limit: "Max 100MB"
  - Browse button
- **Responsive:** Full width on mobile

**Block 3 - Operations Sidebar (After Upload):**

- **Component Type:** Left sidebar with tabs
- **Elements:**
  - Tabs: Overview, Nulls, Duplicates, Convert, Encode, Filter, Columns
  - Each tab shows relevant operation controls
  - Apply button (primary)
  - Reset button (ghost)
- **Responsive:** Bottom sheet on mobile

**Block 4 - Data Preview (Main Content):**

- **Component Type:** Table with controls
- **Elements:**
  - Preview rows slider (1-50, default 5)
  - Data table with column headers and types
  - Pagination controls
  - Download cleaned data button
- **Responsive:** Horizontal scroll on mobile, fixed headers

**Block 5 - History Panel (Right Sidebar):**

- **Component Type:** Timeline list
- **Elements:**
  - Operation history (chronological)
  - Each item: operation name, timestamp, undo button
  - Clear history button
- **Responsive:** Collapsible drawer on mobile

**Navigation:**

- **Entry Points:** Homepage CTA, navbar
- **Exit Points:** "Train Model" button → Train page
- **Primary CTA:** "Proceed to Training"

---

### Train Page (`/train`)

**Purpose:** Select features, choose algorithms, configure and train models

**Layout Type:** Two-column layout (config + results)

**Block 1 - Navbar:**

- **Component Type:** Same as Clean page
- **Elements:**
  - Nav shows: Clean → Train (active) → Results
- **Responsive:** Consistent with other pages

**Block 2 - Feature Selection Panel (Left Column):**

- **Component Type:** Form with checkboxes
- **Elements:**
  - Section: "Select Features"
  - Checkboxes for each column
  - Target variable dropdown
  - Train/test split slider (default 80/20)
  - Problem type detection: "Classification detected" badge
- **Responsive:** Stack vertically on mobile, feature selection first

**Block 3 - Model Selection Panel (Left Column):**

- **Component Type:** Algorithm cards grid
- **Elements:**
  - Section: "Choose Algorithms"
  - Algorithm cards (selectable):
    - Logistic Regression, Random Forest, Decision Tree, SVM
  - "Select All" / "Clear All" buttons
  - Info tooltip for each algorithm
- **Responsive:** Single column on mobile

**Block 4 - Training Control:**

- **Component Type:** Action bar
- **Elements:**
  - "Train Models" button (primary, large)
  - Training configuration: CV folds, random state
- **Responsive:** Fixed bottom bar on mobile

**Block 5 - Training Progress (Right Column):**

- **Component Type:** Status panel
- **Elements:**
  - Progress indicator (spinner + percentage)
  - Current algorithm being trained
  - Estimated time remaining
- **State:** Only visible during training
- **Responsive:** Full width on mobile, appears above results

**Block 6 - Results Preview (Right Column):**

- **Component Type:** Metrics table
- **Elements:**
  - Quick metrics comparison
  - "View Full Results" button → Results page
- **State:** Shows after training completes
- **Responsive:** Scrollable table on mobile

**Navigation:**

- **Entry Points:** Clean page "Proceed to Training"
- **Exit Points:** "View Full Results" → Results page
- **Primary CTA:** "Train Models"

---

### Results Page (`/results`)

**Purpose:** Compare models, visualize performance, export best model

**Layout Type:** Full width with sections

**Block 1 - Navbar:**

- **Component Type:** Same as other pages
- **Elements:**
  - Nav shows: Clean → Train → Results (active)
- **Responsive:** Consistent

**Block 2 - Best Model Highlight:**

- **Component Type:** Hero card
- **Elements:**
  - Badge: "Best Model"
  - Model name: "Random Forest"
  - Key metric: "Accuracy: 94.2%"
  - Icon: trophy or star
  - Download model button
- **Responsive:** Full width, centered

**Block 3 - Metrics Comparison Table:**

- **Component Type:** Sortable data table
- **Elements:**
  - Columns: Model, Accuracy, Precision, Recall, F1 Score, Training Time
  - Rows: Each trained model
  - Best value highlighted in each column
  - Sort controls
- **Responsive:** Horizontal scroll on mobile, sticky first column

**Block 4 - Visualization Tabs:**

- **Component Type:** Tabbed panel
- **Elements:**
  - Tabs: Confusion Matrix, ROC Curves, Feature Importance, Learning Curves
  - Each tab shows interactive chart
  - Model selector dropdown (compare specific models)
- **Responsive:** Full width, charts scale down

**Block 5 - Export Section:**

- **Component Type:** Action buttons
- **Elements:**
  - "Download Predictions" (CSV)
  - "Export Model Config" (JSON)
  - "Save Results" (PDF report)
  - "Train New Model" → Train page
- **Responsive:** Stack vertically on mobile

**Navigation:**

- **Entry Points:** Train page after training complete
- **Exit Points:** "Train New Model" → Train page, "Clean New Data" → Clean page
- **Primary CTA:** Download/export actions

---

### Responsive Constraints Summary

**Desktop (≥1280px):**
- Sidebar + main content + panel layouts
- All features visible simultaneously
- Hover tooltips
- Multi-column grids (3-4 columns)

**Tablet (768px - 1279px):**
- 2-column layouts or stacked
- Collapsible panels
- Touch targets 44px minimum
- 2-column grids

**Mobile (<768px):**
- Single column stacked
- Bottom sheets for secondary panels
- Hamburger navigation
- Full-width cards and buttons
- Touch targets 48px minimum
- Accordion sections

---

## Implementation Timeline (6 Weeks)

### Week 1: Foundation & Data Upload (Days 1-7)

**Days 1-2: Project Setup**
- Initialize React + Vite project with TypeScript
- Configure Tailwind CSS v4 + DaisyUI v5.5
- Set up FastAPI backend structure
- Database models (SQLAlchemy)
- Install dependencies (pandas, scikit-learn, etc.)

**Days 3-4: Design System Implementation**
- Create DaisyUI theme with OKLCH colors
- Implement atom components (Button, Input, Select, Badge, Icon, Spinner, SkillBadge, XPCounter, HintButton)
- Set up Google Fonts (Space Grotesk, Inter) and Material Symbols
- Create layout components (MainLayout, CleaningLayout)

**Days 5-7: File Upload & Dataset Management**
- Implement FileUploader organism (CSV + Excel support)
- Backend: File upload endpoint with validation (multi-sheet detection)
- Multi-sheet Excel workspace (SheetWorkspace organism)
- Sheet merge operations (concat rows/cols, join)
- Data parsing, type detection, and DataPreview organism with slider (1-50 rows)
- Dataset overview stats (nulls, duplicates, types)

**Deliverable:** Working file upload with data preview, multi-sheet support, and merge operations

---

### Week 2: Data Cleaning Operations (Days 8-14)

**Days 8-10: Core Cleaning Operations**
- Null handling (drop, fill) - backend + frontend
- Duplicate detection and removal
- Data type conversion
- OperationPanel organism with tabs
- Apply operation API endpoints

**Days 11-13: Advanced Cleaning**
- Encoding operations (Label, One-Hot, Ordinal)
- Filter operations (numeric ranges, categorical selection)
- Column management (drop, rename, reorder)
- Real-time preview updates after operations

**Day 14: Undo/Redo System**
- History management in backend (session state + database)
- HistoryTimeline organism
- Undo/redo API endpoints
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

**Deliverable:** Fully functional data cleaning with all operations and undo/redo

---

### Week 3: Model Training (Days 15-21)

**Days 15-16: Training Configuration UI**
- TrainingLayout implementation
- Feature selection panel (checkboxes)
- Target variable selection
- Train/test split configuration
- ModelSelector organism with algorithm cards

**Days 17-19: Backend ML Implementation**
- Classification algorithms (Logistic Regression, Random Forest, Decision Tree, SVM)
- Regression algorithms (Linear Regression, Random Forest, Decision Tree, SVR, XGBoost)
- Automatic feature scaling
- Train/test split logic
- Model training endpoints with progress tracking

**Days 20-21: Training Progress & Basic Results**
- Training progress UI (spinner, status)
- Metrics calculation (accuracy, precision, recall, F1, R², MAE, RMSE)
- MetricsPanel organism
- Quick results preview on train page

**Deliverable:** End-to-end model training with metrics

---

### Week 4: Visualization Studio (Days 22-28)

**Days 22-24: Dataset Visualization (Pre-Training)**
- DataVizPanel organism with tabbed chart interface
- Backend visualization endpoints (distribution, correlation, nulls, value-counts, scatter, boxplot)
- Distribution histograms with adjustable bin sizes
- Box plots with outlier detection
- Correlation heatmap with clickable cells
- Null pattern matrix
- Value count bar charts for categorical columns
- Interactive scatter plots with zoom/pan
- Integration with Recharts

**Days 25-27: Training Metrics Visualization (Post-Training)**
- TrainingVizPanel organism with tabbed charts
- Backend results endpoints (confusion matrix, ROC, precision-recall, feature importance, residuals, learning curves, comparison radar)
- Confusion matrix heatmap with metrics
- ROC curves with AUC overlay for multiple models
- Feature importance bar charts (sortable)
- Residual and actual-vs-predicted plots (regression)
- Learning curves for overfitting detection
- Model comparison radar/spider chart
- AI-powered chart insights (plain English interpretation below each chart)

**Day 28: Export, Download & Results Polish**
- Download cleaned dataset (CSV)
- Download predictions (CSV)
- Export model configuration (JSON)
- Chart export as PNG/SVG
- Best model recommendation logic
- Results page layout and metrics comparison table (sortable)

**Deliverable:** Complete visualization studio with 17 chart types, interactive controls, and AI insights

---

### Week 5: ML Academy Core (Days 29-35)

**Days 29-30: Learning Framework**
- XP system and skill level progression (localStorage)
- SkillBadge, XPCounter atoms
- ProgressDashboard organism
- LearnPage (`/learn`) with module cards and progress tracking
- LessonCard, ModuleProgress molecules

**Days 31-33: Modules 1-2 (Rookie + Apprentice)**
- LessonPage (`/learn/:moduleId/:lessonId`) interactive lesson framework
- Module 1: Understanding Data (4 lessons with interactive elements)
- Module 2: Data Cleaning (4 lessons with side-by-side previews)
- QuizPanel organism (multiple choice + drag-and-drop)
- BeforeAfterPreview molecule
- AchievementToast celebrations

**Days 34-35: Practice Sandbox**
- SandboxPage (`/learn/sandbox`) with pre-loaded sample datasets
- AI Mentor HintButton with progressive disclosure (3 levels)
- Reset button for dataset restoration
- Sample datasets: Iris, Titanic, Car Prices, Student Performance, Housing Prices

**Deliverable:** Working ML Academy with 2 modules, sandbox, and progression system

---

### Week 6: ML Academy Advanced & Polish (Days 36-42)

**Days 36-38: Modules 3-5 (Practitioner → Master)**
- Module 3: Understanding ML (4 lessons with algorithm animations)
- Module 4: Model Evaluation (4 lessons with interactive confusion matrices)
- Module 5: Advanced Topics (4 lessons with real-world scenarios)
- ConceptExplainer organism with animations
- ChallengeCard molecule for timed challenges

**Days 39-40: Contextual Learning Integration**
- WhyTooltip molecule on every operation and metric
- MentorBanner molecule with AI-triggered teaching moments
- "Learn More" links connecting operations to Academy lessons
- Skill badges and achievement system

**Days 41-42: Polish, Testing & Documentation**
- Responsive design testing (mobile, tablet, desktop)
- Accessibility audit (WCAG 2.1 AA compliance)
- Toast notifications for all operations
- Error handling and user feedback
- Loading states and animations
- Homepage content and hero section (updated with Academy CTA)
- Navbar update with XP counter and Learn link
- Bug fixes and optimization

**Deliverable:** Production-ready ML Yantra MVP with complete visualization and learning experience

---

**End of PRD**
