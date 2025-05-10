// store/myStore.js
import { create } from 'zustand';

interface Episode {
    paheId0?: string;
    paheId1?: string;
    zoroId?: string;
    id?: string;
    image: string;
    epNo: number;
    number?: number;
    title?: string;
}

interface MyState {
    data: Episode[];
    setData: (data: Episode[]) => void;
}

const useMyStore = create<MyState>((set) => ({
    data: [],
    setData: (data) => set({ data }),
}));

export default useMyStore;