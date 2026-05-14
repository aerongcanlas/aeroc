export type Profile = {
    uid: string;
    firstName: string;
    lastName: string;
    initials: string;
    photoURL: string;
    email: string;
};

export type Stage = {
    id: string;
    name: string;
    color: string;
    order?: number;
};

export type FestivalSet = {
    id: string;
    artist: string;
    day: string;
    stageId: string;
    startTime: string;
    endTime: string;
};

export type Meetup = {
    id: string;
    title: string;
    location: string;
    day: string;
    startTime: string;
    endTime: string;
    createdBy: string;
    createdByName: string;
};

export type Group = {
    id: string;
    name: string;
};

export type GroupMember = Profile;

export type Selection = {
    id: string;
    userIds: string[];
};
