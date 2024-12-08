class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.colors = {
            purple: '#4B1B7F',
            lightPurple: '#9B6BC9',
            blue: '#4885ED',
            green: '#34A853',
            yellow: '#FBBC05',
            red: '#EA4335'
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeCharts());
        } else {
            this.initializeCharts();
        }
    }

    async initializeCharts() {
        try {
            await this.fetchData();
        } catch (error) {
            console.error('Error fetching data:', error);
            this.data = {}; // Use empty data if fetch fails
        }
    
        // Create charts regardless of data availability
        const chartCreators = [
            this.createStatusDistributionChart,
            this.createPriorityDistributionChart,
            this.createCompletionRateChart,
            this.createOverdueAnalysisChart,
            this.createTaskCategoryChart,
            this.createFileActivityChart,
            this.createTaskLoadChart,
            this.createPeakPerformanceChart
        ];
    
        chartCreators.forEach(creator => {
            try {
                creator.call(this);
            } catch (error) {
                console.error(`Error creating chart:`, error);
            }
        });
    }

    async fetchData() {
        const response = await fetch('/api/analytics/dashboard-data/');
        if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
        }
        this.data = await response.json();
    }

    createStatusDistributionChart() {
        const ctx = document.getElementById('statusChart').getContext('2d');
        const data = this.data?.status_distribution || {};
        const labels = Object.keys(data).length ? Object.keys(data) : ['Yet to Start', 'In Progress', 'Completed'];
        const values = Object.keys(data).length ? Object.values(data) : [0, 0, 0];
    
        this.charts.status = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(this.formatLabel),
                datasets: [{
                    label: 'Tasks by Status',
                    data: values,
                    backgroundColor: [
                        this.colors.blue,
                        this.colors.yellow,
                        this.colors.green
                    ]
                }]
            },
            options: {
                ...this.getBarChartOptions('Number of Tasks'),
                plugins: {
                    tooltip: {
                        enabled: true
                    }
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false,
                    axis: 'x'
                }
            }
        });
    }

    createPriorityDistributionChart() {
        const ctx = document.getElementById('priorityChart').getContext('2d');
        const data = this.data?.priority_distribution || {};
        const labels = Object.keys(data).length ? Object.keys(data) : ['High', 'Medium', 'Low'];
        const values = Object.keys(data).length ? Object.values(data) : [0, 0, 0];
    
        this.charts.priority = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(this.formatLabel),
                datasets: [{
                    data: values,
                    backgroundColor: [
                        this.colors.red,
                        this.colors.yellow,
                        this.colors.green
                    ]
                }]
            },
            options: {
                ...this.getDoughnutChartOptions(),
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                                const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createCompletionRateChart() {
        const ctx = document.getElementById('completionRateChart').getContext('2d');
        const data = this.data?.completion_rate || {};
        const lastWeek = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();
        
        const values = lastWeek.map(date => data[date] || 0);
    
        this.charts.completionRate = new Chart(ctx, {
            type: 'line',
            data: {
                labels: lastWeek.map(date => new Date(date).toLocaleDateString()),
                datasets: [{
                    label: 'Completed Tasks',
                    data: values,
                    borderColor: this.colors.purple,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: `${this.colors.purple}20`
                }]
            },
            options: {
                ...this.getLineChartOptions('Number of Tasks'),
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    tooltip: {
                        enabled: true
                    }
                }
            }
        });
    }

    createOverdueAnalysisChart() {
        if (!this.data.overdue_analysis) return;

        const ctx = document.getElementById('overdueChart').getContext('2d');
        const labels = Object.keys(this.data.overdue_analysis);
        const data = Object.values(this.data.overdue_analysis);

        this.charts.overdue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Overdue Tasks',
                    data: data,
                    borderColor: this.colors.red,
                    tension: 0.4
                }]
            },
            options: this.getLineChartOptions('Number of Tasks')
        });
    }

    createTaskCategoryChart() {
        if (!this.data.task_categories) return;

        const ctx = document.getElementById('categoryChart').getContext('2d');
        const labels = Object.keys(this.data.task_categories);
        const data = Object.values(this.data.task_categories);

        this.charts.category = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: this.generateColors(labels.length)
                }]
            },
            options: this.getPolarChartOptions()
        });
    }

    createFileActivityChart() {
        if (!this.data.file_activity) return;

        const ctx = document.getElementById('fileActivityChart').getContext('2d');
        const labels = Object.keys(this.data.file_activity);
        const data = Object.values(this.data.file_activity);

        this.charts.fileActivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(date => new Date(date).toLocaleDateString()),
                datasets: [{
                    label: 'Files Added',
                    data: data,
                    borderColor: this.colors.blue,
                    tension: 0.4
                }]
            },
            options: this.getLineChartOptions('Number of Files')
        });
    }

    createTaskLoadChart() {
        if (!this.data.task_load) return;

        const ctx = document.getElementById('taskLoadChart').getContext('2d');
        const labels = Object.keys(this.data.task_load);
        const data = Object.values(this.data.task_load);

        this.charts.taskLoad = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(date => new Date(date).toLocaleDateString()),
                datasets: [{
                    label: 'Tasks Due',
                    data: data,
                    backgroundColor: this.colors.lightPurple
                }]
            },
            options: this.getBarChartOptions('Number of Tasks')
        });
    }

    createPeakPerformanceChart() {
        if (!this.data.peak_performance) return;

        const ctx = document.getElementById('peakPerformanceChart').getContext('2d');
        const labels = Object.keys(this.data.peak_performance);
        const data = Object.values(this.data.peak_performance);

        this.charts.peakPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: data,
                    backgroundColor: this.colors.purple
                }]
            },
            options: this.getBarChartOptions('Number of Tasks')
        });
    }

    // Helper Methods
    formatLabel(label) {
        return label.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    generateColors(count) {
        const baseColors = Object.values(this.colors);
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    handleError(message) {
        // Add error handling UI logic here
        console.error(message);
    }

    // Chart Options (Same as before)
    getLineChartOptions(yAxisLabel) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                }
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    display: true,
                    position: 'top',
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        if (ci.isDatasetVisible(index)) {
                            ci.hide(index);
                        } else {
                            ci.show(index);
                        }
                    }
                }
            },
            hover: {
                mode: 'nearest',
                intersect: false
            }
        };
    }

    getBarChartOptions(yAxisLabel) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                }
            }
        };
    }

    getDoughnutChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        };
    }

    getPolarChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        };
    }
}

// Initialize analytics when document is ready
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsManager();
});