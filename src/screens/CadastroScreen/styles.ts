import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
        backgroundColor: '#f6fafd',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f6fafd',
    },
    container: {
        alignItems: 'center',
        width: '100%',
    },
    logo: {
        height: 160,
        marginBottom: 24, // aumentado
        alignSelf: 'center',
    },
    title: {
        fontSize: 32, // maior
        fontWeight: 'bold',
        marginBottom: 36, // aumentado
        color: '#007bff',
        alignSelf: 'center',
        letterSpacing: 1,
    },
    input: {
        width: '100%',
        height: 53,
        backgroundColor: '#fff',
        borderColor: '#b0b8c1',
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 18, // maior
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    inputError: {
        borderColor: '#e53935',
    },
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
    loginLinkText: {
        color: '#007bff',
        fontSize: 17, // maior
        textDecorationLine: 'underline',
        marginTop: 10,
        marginBottom: 10,
        fontWeight: '500',
    },
    passwordContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#b0b8c1',
        borderRadius: 10,
        paddingHorizontal: 16,
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
    },
    errorText: {
        color: '#e53935',
        fontSize: 16,
        marginBottom: 20,
        marginLeft: 4,
        fontWeight: '500',
    },
    senhaForca: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 14,
        marginLeft: 4,
        alignSelf: 'flex-start',
    },
    avisoNome: {
        color: '#e6b800',
        fontSize: 16,
        marginBottom: 14,
        marginLeft: 4,
        fontWeight: 'bold',
        alignSelf: 'center',
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
});

export default styles;
