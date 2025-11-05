import { StyleSheet } from 'react-native';

// ==================== Container Styles ====================
const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#f6fafd',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
    },

    // ==================== Logo & Title ====================
    logo: {
        maxHeight: 160,
        height: undefined,
        aspectRatio: 1.5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 26,
        color: '#007bff',
        alignSelf: 'center',
        letterSpacing: 1,
    },

    // ==================== Input States ====================
    inputError: {
        borderColor: '#e53935',
    },
    inputSuccess: {
        borderColor: '#2ecc40',
    },
    inputWarning: {
        borderColor: '#e6b800',
    },
    inputFocus: {
        borderColor: '#007bff',
        borderWidth: 2,
    },

    // ==================== Button ====================
    button: {
        width: '100%',
        backgroundColor: '#0271bb',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 26,
        elevation: 2,
        shadowColor: '#0271bb',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 20, // maior
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },

    // ==================== Links ====================
    loginLinkText: {
        color: '#007bff',
        fontSize: 17, // maior
        textDecorationLine: 'underline',
        marginTop: 10,
        marginBottom: 10,
        fontWeight: '500',
    },

    // ==================== Password Input ====================
    passwordContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#b0b8c1',
        borderRadius: 10,
        paddingHorizontal: 13,
        marginBottom: 22,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        fontSize: 18,
        color: '#000',
        width: '100%',
        includeFontPadding: false,
    },

    // ==================== Input Fields ====================
    inputField: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#000',
        width: '100%',
        includeFontPadding: false,
    },
    inputWithIcon: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: '#b0b8c1',
        borderWidth: 1.5,
        borderRadius: 10,
        paddingLeft: 12,
        paddingRight: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 8,
    },

    // ==================== Error & Warning Texts ====================
    errorText: {
        color: '#e53935',
        fontSize: 16,
        marginBottom: 20,
        marginLeft: 4,
        fontWeight: '500',
    },
    avisoNome: {
        color: '#e6b800',
        fontSize: 16,
        marginBottom: 14,
        marginLeft: 4,
        fontWeight: 'bold',
        alignSelf: 'center',
        marginTop: -7,
    },

    // ==================== Password Strength & Tips ====================
    senhaForca: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 14,
        marginLeft: 4,
        alignSelf: 'flex-start',
    },
    dicaSenha: {
        fontSize: 14,
        color: '#777',
        marginLeft: 4,
        alignSelf: 'flex-start',
        marginBottom: 2,
    },
    dicaEmail: {
        fontSize: 14,
        color: '#777',
        marginLeft: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
        marginTop: -8,
    },
    dicaSenhaContainer: {
        width: '100%',
        marginBottom: 8,
    },
    dicaSenhaTitulo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    dicaSenhaItem: {},
    dicaSenhaCorOk: {
        color: 'green',
    },
    dicaSenhaCorErro: {
        color: 'red',
    },

    // ==================== Password Strength Bar ====================
    barraForcaContainer: {
        width: '100%',
        marginBottom: 8,
    },
    barraForca: {
        height: 6,
        borderRadius: 3,
        marginBottom: 2,
    },
    barraForcaFraca: {
        backgroundColor: '#e53935',
        width: '33%',
    },
    barraForcaMedia: {
        backgroundColor: '#e6b800',
        width: '66%',
    },
    barraForcaForte: {
        backgroundColor: 'green',
        width: '100%',
    },
    barraForcaVazia: {
        backgroundColor: '#ccc',
        width: '0%',
    },
    senhaForcaCorFraca: {
        color: 'red',
    },
    senhaForcaCorMedia: {
        color: '#e6b800',
    },
    senhaForcaCorForte: {
        color: 'green',
    },

    // ==================== Tooltips ====================
    tooltipValido: {
        color: 'green',
        fontSize: 15,
        marginTop: -8,
        marginBottom: 13,
        alignSelf: 'center',
        fontWeight: 'bold',
    },
    tooltipInvalido: {
        color: '#e53935',
        fontSize: 15,
        marginTop: -8,
        marginBottom: 13,
        alignSelf: 'center',
        fontWeight: 'bold',
    },
    tooltipAviso: {
        color: '#e6b800',
        fontSize: 15,
        marginTop: -8,
        marginBottom: 13,
        alignSelf: 'center',
        fontWeight: 'bold',
    },

    // ==================== Utility ====================
    flex1: {
        flex: 1,
    },
});

export default styles;
