import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    banner: {
        width: '100%',
        height: 190,
        borderRadius: 8,
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateText: {
        marginLeft: 6,
        color: '#555',
    },
    priceBox: {
        width: '100%',
        backgroundColor: '#f1f1f1',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    price: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eee',
        borderRadius: 6,
        paddingHorizontal: 12,
        marginVertical: 8,
    },
    counterButton: {
        fontSize: 32,
        paddingHorizontal: 16,
        color: '#007BFF',
    },
    counterValue: {
        fontSize: 21,
        marginHorizontal: 8,
        fontWeight: 'bold',
        color: '#222',
    },
    total: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 8,
    },
    buyButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    buyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    descriptionBox: {
        width: '100%',
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#444',
        textAlign: 'center',
    },
    address: {
        textAlign: 'center',
        fontSize: 13,
        color: '#777',
        marginBottom: 24,
    },
});
