export type RootStackParamList = {
    EventDetail: undefined;
    Purchase: {
        ticketId: string;
        eventTitle: string;
        price: number;
        maxQuantity: number;
        quantity: number;
    };
    // Outras rotas podem ser adicionadas aqui
};
