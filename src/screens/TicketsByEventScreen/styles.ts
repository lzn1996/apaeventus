// src/screens/TicketsByEventScreen/styles.ts
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f8fc',
        padding: 0,
        alignItems: 'center',
        justifyContent: 'center', // Centraliza verticalmente
        minHeight: '100%',
    },
    carousel: {
        marginTop: 0,
        width: '100%',
        alignSelf: 'center', // Centraliza horizontalmente
        justifyContent: 'center', // Centraliza verticalmente dentro do container do carousel, se aplicável
        alignItems: 'center', // Centraliza horizontalmente dentro do container do carousel, se aplicável
    },
    ticketCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 24,
        marginBottom: 18,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#1976d2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        width: 300,
    },
    ticketType: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 8,
    },
    ticketCode: {
        fontSize: 13,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
    },
    ticketStatus: {
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 6,
    },
    ticketUsed: {
        color: '#e53935',
    },
    ticketUnused: {
        color: '#43a047',
    },
    ticketCardContainer: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    eventImage: {
        width: '100%',
        height: 140,
        borderRadius: 12,
        marginBottom: 12,
        resizeMode: 'cover',
    },
    eventInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
        flex: 1,
    },
    eventDate: {
        fontSize: 15,
        color: '#c62828',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    ticketCardBox: {
        backgroundColor: '#f6f8fc',
        borderRadius: 14,
        marginTop: 12,
        padding: 16,
        width: '100%',
        alignItems: 'center',
    },
    ticketInfoRow: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 10,
    },
    ticketInfoLeft: {
        flex: 1,
        alignItems: 'flex-start',
    },
    ticketInfoRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    ticketInfoRightColumn: {
        flex: 1,
        alignItems: 'flex-start',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        paddingInlineStart: 38,
    },
    buyerName: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#222',
    },
    buyerEmail: {
        color: '#1976d2',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    buyerPhone: {
        color: '#222',
        fontSize: 14,
    },
    boughtAt: {
        fontSize: 13,
        color: '#888',
        marginBottom: 2,
    },
    price: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#1976d2',
    },
    qrCodeContainer: {
        marginVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrCodeImage: {
        width: 180,
        height: 180,
        marginVertical: -12,
        marginBlockStart: 14,
    },
    ticketCountText: {
        fontWeight: 'bold',
        color: '#1976d2',
        fontSize: 18,
        alignSelf: 'flex-start',
        marginLeft: 16,
        marginTop: 14,
        marginBottom: 8,
        letterSpacing: 1,
    },
    carouselSpacer: {
        height: 8,
    },
    pendingSyncBadge: {
        backgroundColor: '#FFF3CD',
        borderRadius: 6,
        padding: 4,
        marginBottom: 4,
        alignSelf: 'flex-start',
    },
    pendingSyncText: {
        color: '#FFA500',
        fontWeight: 'bold',
        fontSize: 13,
    },
    buttonToggleUsed: {
        backgroundColor: '#1976d2',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 12,
        alignSelf: 'center',
    },
    buttonToggleUsedDesfazer: {
        backgroundColor: '#f44336',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 12,
        alignSelf: 'center',
    },
    buttonToggleUsedText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 4,
        backgroundColor: '#d0d0d0',
    },
    dotActive: {
        backgroundColor: '#007AFF',
    },
});
