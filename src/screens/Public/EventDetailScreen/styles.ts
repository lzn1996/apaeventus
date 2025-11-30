import { StyleSheet } from 'react-native';

/*
Organized styles by grouping related components and layout elements together.
Order: root/layout, containers, banners, titles, sections, boxes, buttons, counters, text, loading/error, navigation/back.
No risk of style overwriting as all keys are unique.
*/
export default StyleSheet.create({
    // Layout
    root: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        padding: 24,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },

    // Banner
    banner: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 12,
        marginBottom: 18,
        backgroundColor: '#e9e9e9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        maxHeight: 360, // Limit max height for better responsiveness
    },

    // Titles
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        color: '#1a237e',
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#1a237e',
    },

    // Date Row
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        justifyContent: 'center',
    },
    dateText: {
        marginLeft: 8,
        color: '#555',
        fontSize: 14,
    },

    // Price Box
    priceBox: {
        width: '100%',
        backgroundColor: '#f1f6fe',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#e3eafc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    price: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        color: '#1976d2',
    },
    total: {
        fontSize: 17,
        fontWeight: '600',
        marginTop: 10,
        color: '#333',
    },

    // Counter
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3eafc',
        borderRadius: 8,
        paddingHorizontal: 16,
        marginVertical: 10,
    },
    counterButton: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingHorizontal: 18,
        color: '#1976d2',
    },
    counterButtonDisabled: {
        opacity: 0.4,
    },
    counterValue: {
        fontSize: 22,
        marginHorizontal: 10,
        fontWeight: 'bold',
        color: '#222',
    },

    // Buy Button
    buyButton: {
        backgroundColor: '#1976d2',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    buyButtonDisabled: {
        backgroundColor: '#b0bec5',
        opacity: 0.7,
    },
    buyButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },

    // Limit Warning
    limitWarning: {
        fontSize: 13,
        color: '#ff6f00',
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },

    // Description Box
    descriptionBox: {
        width: '100%',
        backgroundColor: '#f9f9f9',
        padding: 18,
        borderRadius: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#e3eafc',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
        textAlign: 'center',
    },

    // Address
    address: {
        textAlign: 'center',
        fontSize: 14,
        color: '#607d8b',
        marginBottom: 28,
        marginTop: 6,
        fontWeight: '500',
    },

    // Error
    errorText: {
        color: 'red',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Back/Navigation
    backContainer: {
        alignItems: 'center',
        marginTop: 6,
    },
    backText: {
        color: '#1976d2',
        fontSize: 16,
        fontWeight: '600',
    },
});
