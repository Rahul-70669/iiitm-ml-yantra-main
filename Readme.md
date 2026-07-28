# ML Yantra - Startup Guide

## 🚀 Quick Start (Every Time)

### 1. Start Backend Server
```powershell
cd C:\Users\ASUS\Desktop\ML-Mantra\backend
python -m uvicorn main:app --reload --port 8000
```
Backend will run on: **http://localhost:8000**

### 2. Start Frontend (New Terminal)
```powershell
cd C:\Users\ASUS\Desktop\ML-Mantra\frontend
npm run dev
```
Frontend will run on: **http://localhost:5173**

### 3. Open Application
Navigate to: **http://localhost:5173**

---

## 📋 Features to Test

### 1. Data Cleaning
- Go to **Clean** page
- Upload a CSV file
- View dataset preview and statistics
- Try cleaning operations:
  - Handle nulls (drop/fill)
  - Remove duplicates
  - Convert data types
  - Encode categorical columns
  - Filter rows
  - Manage columns
- Use **Undo/Redo** buttons
- Download cleaned dataset

### 2. Model Training
- Go to **Train** page (after uploading data)
- Select features and target
- Choose problem type (classification/regression)
- Select algorithms
- Set **Train/Test/Validation split** (optional 3-way split for hold-out validation)
- Train models (system auto-detects imbalance and applies SMOTE + stratified splits)
- View results and metrics (models rank by F1 Score if data is imbalanced)
- Download best model
- **Export configuration**

### 3. Validate on Unseen Data (Predictions)
- After training, scroll to **"Validate on Unseen Data"** section
- **Upload CSV:** Test your best model on a completely new file
- **Manual Entry:** Enter feature values manually for an instant single prediction

### 4. AI Assistant 🤖
- Click **floating AI button** (bottom-right)
- Quick Actions:
  - **Analyze Dataset** - Get AI insights
  - **Cleaning Tips** - Get recommendations
  - **Algorithm Advice** - Get model suggestions
- Ask custom questions about ML, Data Science terminology, and algorithmic theory
- AI is context-aware of your dataset architecture

---

## 🔒 System Constraints (Limits)

- **Maximum Upload Limit**: Data files larger than `200MB` will be explicitly blocked at the API layer.
- **Max Excel Sheets**: Workbooks with `> 10` individual sheets are rejected prior to processing to prevent unmanaged RAM allocation.
- **Cache Persistence**: Background automation clears modified dataset history that lapses `24 hours` of inactivity.

---

## 🛠️ Development Commands

### Backend

```powershell
# Install dependencies
cd backend
pip install -r requirements.txt

# Run server
python -m uvicorn main:app --reload --port 8000

# Run with custom host
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# View API docs
# Navigate to: http://localhost:8000/docs
```

### Frontend

```powershell
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
ML-Mantra/
├── backend/
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   │   ├── data.py     # Upload, clean, download
│   │   │   ├── train.py    # Training, predictions
│   │   │   └── ai_assistant.py  # AI chat
│   │   └── services/       # Business logic
│   │       ├── dataset_manager.py
│   │       ├── model_trainer.py
│   │       ├── gemini_service.py    # AI
│   │       └── context_builder.py   # AI context
│   ├── main.py            # FastAPI app
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   │   ├── atoms/
    │   │   ├── molecules/
    │   │   └── organisms/
    │   │       ├── AIChatPanel/      # AI chat UI
    │   │       └── ...
    │   ├── pages/         # Main pages
    │   │   ├── Home.tsx
    │   │   ├── Clean.tsx
    │   │   └── Train.tsx
    │   └── services/
    │       └── api.ts     # API client
    └── package.json
```

---

## 🔧 Troubleshooting

### Backend Issues

**Port already in use:**
```powershell
# Find process on port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /F /PID <PID>
```

**Module not found:**
```powershell
pip install -r requirements.txt
```

### Frontend Issues

**Dependencies missing:**
```powershell
npm install
```

**Vite not found:**
```powershell
npm install -g vite
```

**Port 5173 in use:**
- Vite will automatically use next available port
- Or manually specify: `npm run dev -- --port 3000`

---

## 🌐 API Endpoints

### Data Operations
- `POST /upload` - Upload CSV file
- `GET /preview/{session_id}` - Preview data
- `GET /statistics/{session_id}` - Get stats
- `POST /clean/*` - Cleaning operations
- `GET /download/{session_id}` - Download cleaned data
- `POST /history/undo/{session_id}` - Undo operation
- `POST /history/redo/{session_id}` - Redo operation

### Training
- `POST /train/start/{session_id}` - Start training
- `GET /train/results/{training_id}` - Get results
- `POST /train/predict/{training_id}/{model_id}` - Make prediction
- `GET /train/download-model/{training_id}/{model_id}` - Download model
- `GET /train/export-config/{training_id}` - Export config

### AI Assistant
- `POST /ai/chat` - Chat with AI
- `POST /ai/analyze-dataset` - Analyze dataset
- `POST /ai/recommend-cleaning` - Get cleaning tips
- `POST /ai/recommend-algorithms` - Get algorithm advice

**API Documentation:** http://localhost:8000/docs

---

## 🔑 Configuration

### Environment Variables

**Backend** (Required for AI Features):
- Create a `.env` file in the root or `backend/` directory.
- `GEMINI_API_KEY=your_api_key_here`
- Note: If no API key is provided, the platform degrades gracefully, disabling the AI Assistant but allowing all core ML functionalities to operate normally!

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

---

## 📊 Supported Algorithms

### Classification
- Logistic Regression
- Random Forest Classifier
- SVM
- K-Nearest Neighbors
- Gradient Boosting
- XGBoost

### Regression
- Linear Regression
- Random Forest Regressor
- SVM Regressor
- Gradient Boosting
- XGBoost

---

## 💾 Sample Datasets

Test with these types of files:
- **Classification**: Iris, Titanic, Customer Churn
- **Regression**: House Prices, Sales Forecast
- **Any CSV** with headers and mixed data types

---

## 🎯 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts and opens in browser
- [ ] Upload CSV file successfully
- [ ] View dataset preview and statistics
- [ ] Perform cleaning operations
- [ ] Undo/Redo works
- [ ] Download cleaned dataset
- [ ] Train models successfully
- [ ] View training results and charts
- [ ] Make predictions on new data
- [ ] Export model configuration
- [ ] AI Assistant chat opens
- [ ] AI provides context-aware responses
- [ ] Quick actions work (Analyze, Tips, Advice)

---

## 📝 Notes

- Backend auto-reloads on code changes
- Frontend hot-reloads on save
- Dataset stored in-memory (lost on restart)
- Training results stored in-memory
- AI chat history per session

---

## 🚀 Ready to Test!

1. Open **2 terminals**
2. Run backend command in terminal 1
3. Run frontend command in terminal 2
4. Open http://localhost:5173
5. Upload a dataset and explore!

**Have fun building ML models! 🎉🤖**
