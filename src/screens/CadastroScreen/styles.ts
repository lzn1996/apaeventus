import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#f6fafd',
    },
    container: {
        flex: 1, // Isso fará com que o container interno ocupe todo o espaço disponível
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
    },
    logo: {
        maxHeight: 180, // altura máxima dinâmica
        height: undefined, // garante que não há altura fixa
        aspectRatio: 1.5, // mantém proporção visual agradável
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
    flex1: {
        flex: 1,
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
    barraForcaContainer: {
        width: '100%',
        marginBottom: 8,
    },
    barraForca: {
        height: 6,
        borderRadius: 3,
        marginBottom: 2,
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
});

export default styles;
