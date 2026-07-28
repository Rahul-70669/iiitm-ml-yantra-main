import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ml-yantra-backend.onrender.com'

class APIClient {
    private client: AxiosInstance

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 300000, // 5 minutes to accommodate large dataset processing and model training
        })

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                return Promise.reject(this.handleError(error))
            }
        )
    }

    private handleError(error: AxiosError): Error {
        if (error.response) {
            // Server responded with error status
            const message =
                (error.response.data as { detail?: string })?.detail ||
                'An error occurred'
            return new Error(message)
        } else if (error.request) {
            // Request made but no response
            return new Error('No response from server. Please check your connection.')
        } else {
            // Something else happened
            return new Error(error.message || 'An unknown error occurred')
        }
    }

    // File Upload
    async uploadFile(file: File, sessionId?: string): Promise<{
        session_id: string
        filename: string
        rows: number
        columns: number
        column_names: string[]
        column_types: Record<string, string>
        is_multi_sheet: boolean
        group_id?: string
        sheets: Array<{
            sheet_name: string
            session_id: string
            rows: number
            columns: number
            column_names: string[]
            column_types: Record<string, string>
        }>
    }> {
        const formData = new FormData()
        formData.append('file', file)
        if (sessionId) {
            formData.append('session_id', sessionId)
        }

        const response = await this.client.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    }

    // Get sheets info for a group
    async getSheets(groupId: string): Promise<{
        group_id: string
        sheets: Array<{
            sheet_name: string
            session_id: string
            rows: number
            columns: number
            column_names: string[]
            column_types: Record<string, string>
        }>
    }> {
        const response = await this.client.get(`/sheets/${groupId}`)
        return response.data
    }

    // Get common columns between sheets
    async getCommonColumns(groupId: string, sheetNames: string[]): Promise<{
        common_columns: string[]
        all_columns: Record<string, string[]>
        unique_columns: string[]
        sheets_have_same_columns: boolean
    }> {
        const response = await this.client.get(`/sheets/${groupId}/common-columns`, {
            params: { sheet_names: sheetNames.join(',') }
        })
        return response.data
    }

    // Merge sheets
    async mergeSheets(
        groupId: string,
        sheetNames: string[],
        mergeType: 'concat_rows' | 'concat_cols' | 'join',
        onColumn?: string,
        how?: string
    ): Promise<{
        session_id: string
        rows: number
        columns: number
        column_names: string[]
        column_types: Record<string, string>
        message: string
    }> {
        const response = await this.client.post('/merge', {
            group_id: groupId,
            sheet_names: sheetNames,
            merge_type: mergeType,
            on_column: onColumn,
            how: how || 'inner'
        })
        return response.data
    }

    // Get Dataset Preview
    async getPreview(
        sessionId: string,
        numRows: number = 5
    ): Promise<{
        data: Record<string, any>[]
        total_rows: number
    }> {
        const response = await this.client.get(`/preview/${sessionId}`, {
            params: { num_rows: numRows },
        })
        return response.data
    }

    async getNullsPreview(
        sessionId: string,
        columns?: string[]
    ): Promise<{
        data: Record<string, any>[]
        total_rows: number
    }> {
        const params = columns ? { columns: columns.join(',') } : {}
        const response = await this.client.get(`/preview/nulls/${sessionId}`, { params })
        return response.data
    }

    async getDuplicatesPreview(
        sessionId: string
    ): Promise<{
        data: Record<string, any>[]
        total_rows: number
    }> {
        const response = await this.client.get(`/preview/duplicates/${sessionId}`)
        return response.data
    }

    // Get Dataset Statistics
    async getStatistics(sessionId: string): Promise<{
        total_rows: number
        total_columns: number
        null_counts: Record<string, number>
        duplicate_rows: number
        column_types: Record<string, string>
        numeric_stats: Record<
            string,
            {
                mean: number
                median: number
                std: number
                min: number
                max: number
            }
        >
    }> {
        const response = await this.client.get(`/statistics/${sessionId}`)
        return response.data
    }

    // Correlation Matrix
    async getCorrelation(sessionId: string): Promise<{
        columns: string[]
        matrix: number[][]
    }> {
        const response = await this.client.get(`/correlation/${sessionId}`)
        return response.data
    }

    // Column Distribution
    async getDistribution(sessionId: string, column: string): Promise<any> {
        const response = await this.client.get(`/distribution/${sessionId}/${encodeURIComponent(column)}`)
        return response.data
    }

    // Scatter Plot Data
    async getScatterData(sessionId: string): Promise<{
        pairs: { x_col: string; y_col: string; x: number[]; y: number[] }[]
        columns: string[]
    }> {
        const response = await this.client.get(`/scatter/${sessionId}`)
        return response.data
    }

    // Line Plot Data
    async getLinePlotData(sessionId: string, xCol: string, yCol: string): Promise<{
        x_col: string
        y_col: string
        data: Record<string, any>[]
    }> {
        const response = await this.client.get(`/lineplot/${sessionId}`, { params: { x_col: xCol, y_col: yCol } })
        return response.data
    }

    // Box Plot Data
    async getBoxPlotData(sessionId: string, column: string): Promise<{
        column: string
        min: number
        q1: number
        median: number
        q3: number
        max: number
        outliers: number[]
    }> {
        const response = await this.client.get(`/boxplot/${sessionId}`, { params: { column } })
        return response.data
    }

    async getHistogramData(sessionId: string, column: string, bins: number = 20): Promise<{
        column: string
        counts: number[]
        bins: number[]
    }> {
        const response = await this.client.get(`/histogram/${sessionId}`, { params: { column, bins } })
        return response.data
    }

    async getCountPlotData(sessionId: string, column: string): Promise<{
        column: string
        labels: string[]
        counts: number[]
    }> {
        const response = await this.client.get(`/countplot/${sessionId}`, { params: { column } })
        return response.data
    }

    async getBarPlotData(sessionId: string, xCol: string, yCol: string, agg: string = 'mean'): Promise<{
        x_col: string
        y_col: string
        agg: string
        labels: string[]
        values: number[]
    }> {
        const response = await this.client.get(`/barplot/${sessionId}`, { params: { x_col: xCol, y_col: yCol, agg } })
        return response.data
    }

    // Data Cleaning Operations
    async handleNulls(
        sessionId: string,
        strategy: 'drop' | 'fill_mean' | 'fill_median' | 'fill_mode' | 'fill_value',
        columns?: string[],
        fillValue?: any
    ): Promise<{ session_id: string; message: string }> {
        const response = await this.client.post(`/clean/nulls/${sessionId}`, {
            strategy,
            columns,
            fill_value: fillValue,
        })
        return response.data
    }

    async handleDuplicates(
        sessionId: string,
        keep: 'first' | 'last' | 'none' = 'first'
    ): Promise<{ session_id: string; message: string; removed_count: number }> {
        const response = await this.client.post(`/clean/duplicates/${sessionId}`, {
            keep,
        })
        return response.data
    }

    async convertDataType(
        sessionId: string,
        column: string,
        targetType: 'int' | 'float' | 'str' | 'datetime'
    ): Promise<{ session_id: string; message: string }> {
        const response = await this.client.post(`/clean/convert/${sessionId}`, {
            column,
            target_type: targetType,
        })
        return response.data
    }

    async encodeColumn(
        sessionId: string,
        column: string,
        method: 'label' | 'onehot' | 'ordinal'
    ): Promise<{ session_id: string; message: string; new_columns?: string[] }> {
        const response = await this.client.post(`/clean/encode/${sessionId}`, {
            column,
            method,
        })
        return response.data
    }

    async normalizeColumns(
        sessionId: string,
        columns: string[],
        method: 'standard' | 'minmax' = 'standard'
    ): Promise<{ session_id: string; message: string }> {
        const response = await this.client.post(`/clean/normalize/${sessionId}`, {
            columns,
            method,
        })
        return response.data
    }

    async filterRows(
        sessionId: string,
        column: string,
        operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'between' | 'top_n' | 'bottom_n' | 'starts_with' | 'ends_with' | 'regex' | 'is_empty' | 'is_null' | 'is_not_null' | 'in' | 'not_in' | 'before' | 'after' | 'date_between' | 'outliers' | 'percentile',
        value: string,
        value2?: string,
        valuesList?: string[]
    ): Promise<void> {
        await this.client.post(`/clean/filter/${sessionId}`, {
            session_id: sessionId,
            column,
            operator,
            value,
            value2: value2 || null,
            values_list: valuesList || null,
        })
    }

    async manageColumns(
        sessionId: string,
        action: 'drop' | 'rename',
        columns: string[],
        newNames?: Record<string, string>
    ): Promise<void> {
        await this.client.post(`/clean/columns/${sessionId}`, {
            session_id: sessionId,
            action,
            columns,
            new_names: newNames,
        })
    }

    async stringOperations(
        sessionId: string,
        column: string,
        operation: string,
        findStr?: string,
        replaceStr?: string,
        regexPattern?: string
    ): Promise<void> {
        await this.client.post(`/clean/string_ops/${sessionId}`, {
            column, operation,
            find_str: findStr || '',
            replace_str: replaceStr || '',
            regex_pattern: regexPattern || '',
        })
    }

    async removeOutliers(
        sessionId: string,
        column: string,
        method: string,
        threshold: number
    ): Promise<void> {
        await this.client.post(`/clean/outliers/${sessionId}`, {
            column, method, threshold,
        })
    }

    async featureEngineering(
        sessionId: string,
        newColumn: string,
        expression: string
    ): Promise<void> {
        await this.client.post(`/clean/feature_eng/${sessionId}`, {
            new_column: newColumn,
            expression,
        })
    }

    async dateOperations(
        sessionId: string,
        column: string,
        operation: string,
        secondColumn?: string
    ): Promise<void> {
        await this.client.post(`/clean/date_ops/${sessionId}`, {
            column, operation,
            second_column: secondColumn || null,
        })
    }

    async binning(
        sessionId: string,
        column: string,
        method: string,
        nBins: number,
        labels?: string[],
        customEdges?: number[]
    ): Promise<void> {
        await this.client.post(`/clean/binning/${sessionId}`, {
            column, method,
            n_bins: nBins,
            labels: labels || null,
            custom_edges: customEdges || null,
        })
    }

    async sampling(
        sessionId: string,
        method: string,
        fraction: number,
        nRows?: number,
        stratifyColumn?: string
    ): Promise<void> {
        await this.client.post(`/clean/sampling/${sessionId}`, {
            method, fraction,
            n_rows: nRows || null,
            stratify_column: stratifyColumn || null,
        })
    }

    // Download Cleaned Dataset
    async downloadDataset(sessionId: string): Promise<Blob> {
        const response = await this.client.get(`/download/${sessionId}`, {
            responseType: 'blob',
        })
        return response.data
    }

    // ML Training Operations

    async validateFeatures(sessionId: string, config: {
        features: string[]
        target: string
        problemType: 'classification' | 'regression'
    }): Promise<{
        valid: boolean
        warnings: Array<{ level: string; column?: string; message: string }>
        errors: Array<{ level: string; column?: string; message: string }>
    }> {
        const response = await this.client.post(`/train/validate-features/${sessionId}`, config)
        return response.data
    }

    async startTraining(sessionId: string, config: {
        features: string[]
        target: string
        problemType: 'classification' | 'regression'
        algorithms: string[]
        trainTestSplit: number
        validationSplit: number
        scaling: boolean
    }): Promise<{
        trainingId: string
        session_id: string
        problemType: string
        models: Array<{
            modelId: string
            name: string
            algorithm: string
            metrics: Record<string, number | null>
            confusionMatrix?: number[][]
            featureImportance?: Record<string, number>
            trainingTime: number
            isBest: boolean
        }>
        bestModel: string
        message: string
        classDistribution?: Record<string, number>
        imbalanceRatio?: number
        smoteApplied?: boolean
        validationMetrics?: {
            metrics: Record<string, number | null>
            confusionMatrix?: number[][] | null
            validationRows: number
            bestModelName: string
        }
    }> {
        const response = await this.client.post(`/train/start/${sessionId}`, config)
        return response.data
    }

    async getTrainingResults(trainingId: string): Promise<{
        trainingId: string
        session_id: string
        problemType: string
        models: Array<{
            modelId: string
            name: string
            algorithm: string
            metrics: Record<string, number | null>
            confusionMatrix?: number[][]
            featureImportance?: Record<string, number>
            trainingTime: number
            isBest: boolean
        }>
        bestModel: string
        message: string
    }> {
        const response = await this.client.get(`/train/results/${trainingId}`)
        return response.data
    }

    async downloadModel(trainingId: string, modelId: string): Promise<Blob> {
        const response = await this.client.get(
            `/train/download-model/${trainingId}/${modelId}`,
            { responseType: 'blob' }
        )
        return response.data
    }

    async exportConfig(trainingId: string): Promise<Blob> {
        const response = await this.client.get(`/train/export-config/${trainingId}`, {
            responseType: 'blob',
        })
        return response.data
    }

    async makePrediction(trainingId: string, modelId: string, data: Record<string, any>): Promise<{
        prediction: number[]
        probabilities?: number[][]
    }> {
        const response = await this.client.post(
            `/train/predict/${trainingId}/${modelId}`,
            data
        )
        return response.data
    }

    // Undo/Redo
    async undo(sessionId: string): Promise<{ message: string }> {
        const response = await this.client.post(`/history/undo/${sessionId}`)
        return response.data
    }

    async redo(sessionId: string): Promise<{ message: string }> {
        const response = await this.client.post(`/history/redo/${sessionId}`)
        return response.data
    }

    async getHistory(sessionId: string): Promise<{
        operations: Array<{
            id: string
            operation: string
            timestamp: string
            params: Record<string, any>
        }>
        current_index: number
    }> {
        const response = await this.client.get(`/history/${sessionId}`)
        return response.data
    }

    // AI Assistant
    async chatWithAI(sessionId: string, message: string, includeTraining: boolean = false): Promise<{
        response: string
        context_used: Record<string, any>
    }> {
        const response = await this.client.post('/ai/chat', {
            session_id: sessionId,
            message,
            include_training: includeTraining
        })
        return response.data
    }

    async analyzeDataset(sessionId: string): Promise<{ response: string }> {
        const response = await this.client.post('/ai/analyze-dataset', {
            session_id: sessionId
        })
        return response.data
    }

    async recommendCleaning(sessionId: string): Promise<{ response: string }> {
        const response = await this.client.post('/ai/recommend-cleaning', {
            session_id: sessionId
        })
        return response.data
    }

    async recommendAlgorithms(
        sessionId: string,
        problemType: string,
        features: string[],
        target: string
    ): Promise<{ response: string }> {
        const response = await this.client.post('/ai/recommend-algorithms', {
            session_id: sessionId,
            problem_type: problemType,
            features,
            target
        })
        return response.data
    }

    async recommendVisualization(
        sessionId: string,
        plotType: string,
        selectedColumns: string[]
    ): Promise<{ response: string }> {
        const response = await this.client.post('/ai/recommend-visualization', {
            session_id: sessionId,
            plot_type: plotType,
            selected_columns: selectedColumns
        })
        return response.data
    }

    // Validation on unseen data
    async validateOnUnseenData(trainingId: string, modelId: string, file: File): Promise<{
        totalRows: number
        validRows: number
        predictions: any[]
        probabilities: any[] | null
        hasTarget: boolean
        metrics: Record<string, number | null> | null
        confusionMatrix: number[][] | null
    }> {
        const formData = new FormData()
        formData.append('file', file)
        const response = await this.client.post(
            `/train/validate-unseen/${trainingId}/${modelId}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        return response.data
    }

    async predictManual(trainingId: string, modelId: string, values: Record<string, number>): Promise<{
        prediction: any
        probabilities: number[] | null
    }> {
        const response = await this.client.post(
            `/train/predict-manual/${trainingId}/${modelId}`,
            { values }
        )
        return response.data
    }

    // ═══════════════════════ AutoPilot ═══════════════════════

    async analyzeForAutoPilot(sessionId: string): Promise<{
        session_id: string
        rows: number
        columns: number
        column_names: string[]
        column_types: Record<string, string>
        null_summary: Record<string, number>
        duplicate_rows: number
        numeric_columns: string[]
        categorical_columns: string[]
        target_suggestions: Array<{
            column: string
            confidence: number
            problem_type: string
            reason: string
        }>
    }> {
        const response = await this.client.post(`/autopilot/analyze/${sessionId}`)
        return response.data
    }

    async runAutoPilot(sessionId: string, config: {
        target: string
        problem_type: string
    }): Promise<{
        autopilot_id: string
        session_id: string
        problem_type: string
        pipeline_log: Array<{
            step: string
            category: string
            description: string
            details?: Record<string, any>
            duration_ms?: number
        }>
        before_summary: Record<string, any>
        after_summary: Record<string, any>
        eda_charts: Array<{
            chart_type: string
            title: string
            data: any
        }>
        training_results: {
            models: Array<{
                modelId: string
                name: string
                algorithm: string
                metrics: Record<string, number | null>
                confusionMatrix?: number[][]
                featureImportance?: Record<string, number>
                trainingTime: number
                hyperparameters?: Record<string, any>
                isBest: boolean
            }>
            bestModel: string
            problemType: string
            smoteApplied?: boolean
        }
        best_model_name: string
        best_model_id: string
        best_metrics: Record<string, number | null>
        feature_importance?: Record<string, number>
    }> {
        const response = await this.client.post(`/autopilot/run/${sessionId}`, config)
        return response.data
    }

    async downloadNotebook(autopilotId: string): Promise<Blob> {
        const response = await this.client.get(`/autopilot/download-notebook/${autopilotId}`, {
            responseType: 'blob',
        })
        return response.data
    }

    async downloadAutoPilotCleaned(autopilotId: string): Promise<Blob> {
        const response = await this.client.get(`/autopilot/download-cleaned/${autopilotId}`, {
            responseType: 'blob',
        })
        return response.data
    }

    async downloadAutoPilotModel(autopilotId: string): Promise<Blob> {
        const response = await this.client.get(`/autopilot/download-model/${autopilotId}`, {
            responseType: 'blob',
        })
        return response.data
    }

    // ─── Report Studio ─────────────────────────────────────────

    async listReportTemplates(): Promise<any> {
        const response = await this.client.get('/reports/templates')
        return response.data
    }

    async generateReport(sessionId: string, templateId: string, options: {
        customTitle?: string; useAi?: boolean; autopilotId?: string;
    } = {}): Promise<any> {
        const response = await this.client.post('/reports/generate', {
            session_id: sessionId,
            template_id: templateId,
            custom_title: options.customTitle,
            use_ai: options.useAi ?? false,
            autopilot_id: options.autopilotId,
        })
        return response.data
    }

    async generateCustomReport(sessionId: string, description: string, useAi: boolean = true, blueprint?: any): Promise<any> {
        const response = await this.client.post('/reports/generate-custom', {
            session_id: sessionId,
            description,
            use_ai: useAi,
            blueprint: blueprint
        })
        return response.data
    }

    async suggestReport(sessionId: string, description: string): Promise<any> {
        const response = await this.client.post('/reports/suggest', {
            session_id: sessionId,
            description,
        })
        return response.data
    }

    async refineReport(reportId: string, feedback: string): Promise<any> {
        const response = await this.client.post('/reports/refine', {
            report_id: reportId,
            feedback,
        })
        return response.data
    }

    async downloadReport(reportId: string, format: 'pdf' | 'md' | 'pptx'): Promise<Blob> {
        const response = await this.client.get(`/reports/download/${reportId}/${format}`, {
            responseType: 'blob',
        })
        return response.data
    }
}

export const apiClient = new APIClient()
export default apiClient

