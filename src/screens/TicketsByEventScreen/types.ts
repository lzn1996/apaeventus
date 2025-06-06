// src/screens/TicketsByEventScreen/types.ts

export interface Ticket {
    eventImageUrl: any;
    id: string;
    type: string;
    code: string;
    used: boolean;
    qrCodeUrl: string;
    pdfUrl: string;
    qrCodeDataUrl: string;
    eventDate: string;
    buyer: {
        name: string;
        email: string;
        phone: string;
    };
    boughtAt: string;
    price: number;
}

export interface TicketsByEventScreenProps {
    eventId: string;
    tickets: Ticket[];
}
