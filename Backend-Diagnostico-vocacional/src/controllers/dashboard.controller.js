// src/controllers/dashboardController.js

const User = require('../models/user');
const TestResult = require('../models/result');

// Función principal para obtener las estadísticas del dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Todas las métricas son independientes entre sí: se piden en UNA sola
        // ola concurrente en vez de encadenar ~7 consultas en serie contra Atlas.
        const [
            totalUsers,
            completedTests,
            maleUsers,
            femaleUsers,
            ageStats,
            topAreasRaw,
            monthlyRegistrations,
        ] = await Promise.all([
            User.countDocuments(),
            TestResult.countDocuments(),
            User.countDocuments({ sexo: 'Hombre' }),
            User.countDocuments({ sexo: 'Mujer' }),
            User.aggregate([
                { $match: { edad: { $exists: true, $ne: null } } },
                { $group: { _id: null, averageAge: { $avg: '$edad' }, ages: { $push: '$edad' } } },
            ]),
            TestResult.aggregate([
                { $project: { areas: { $objectToArray: "$results" } } },
                { $unwind: "$areas" },
                { $group: { _id: "$areas.k", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            User.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: { $ifNull: ['$createdAt', new Date()] } },
                            month: { $month: { $ifNull: ['$createdAt', new Date()] } },
                        },
                        users: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
        ]);

        const pendingTests = Math.max(0, totalUsers - completedTests);

        // Edad promedio y distribución por edad
        const averageAge = (ageStats.length > 0 && ageStats[0].averageAge) ? parseFloat(ageStats[0].averageAge.toFixed(2)) : 0;
        const allAges = ageStats.length > 0 ? ageStats[0].ages : [];
        const ageRanges = { '15-17': 0, '18-20': 0, '21-23': 0, '24-26': 0, '27+': 0 };
        allAges.forEach(age => {
            if (typeof age !== 'number') return;
            if (age >= 15 && age <= 17) ageRanges['15-17']++;
            else if (age >= 18 && age <= 20) ageRanges['18-20']++;
            else if (age >= 21 && age <= 23) ageRanges['21-23']++;
            else if (age >= 24 && age <= 26) ageRanges['24-26']++;
            else if (age >= 27) ageRanges['27+']++;
        });
        const ageDistribution = Object.keys(ageRanges).map(range => ({ ageRange: range, count: ageRanges[range] }));

        // Áreas más populares
        const topAreas = topAreasRaw.map(area => ({
            area: area._id,
            count: area.count,
            percentage: completedTests > 0 ? parseFloat(((area.count / completedTests) * 100).toFixed(2)) : 0,
        }));

        // Crecimiento mensual
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const formattedMonthlyRegistrations = monthlyRegistrations.map(item => ({
            month: item._id.month ? monthNames[item._id.month - 1] : "N/A",
            users: item.users,
        }));

        // Tasa de finalización de tests
        const testCompletionRate = totalUsers > 0 ? parseFloat(((completedTests / totalUsers) * 100).toFixed(1)) : 0;

        res.json({
            totalUsers,
            completedTests,
            pendingTests,
            maleUsers,
            femaleUsers,
            testCompletionRate,
            averageAge,
            ageDistribution,
            topAreas,
            monthlyRegistrations: formattedMonthlyRegistrations,
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor al obtener las estadísticas',
            error: error.message 
        });
    }
};