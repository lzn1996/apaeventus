export type RootStackParamList = {
    EventDetail: undefined;
    Purchase: {
        ticketId: string;
        eventTitle: string;
        price: number;
        maxQuantity: number;
        quantity: number;
    };
    MyTickets: undefined;
        TicketsByEvent: {
            eventId: string;
            eventTitle: string;
        };
    // Outras rotas podem ser adicionadas aqui
};
