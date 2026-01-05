
CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

CREATE TABLE exercise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    abc TEXT NOT NULL,      
    userID INTEGER NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    bpm INTEGER,
    a_steps INTEGER,
    d_steps INTEGER,
    s_note INTEGER,
    h_note INTEGER,
    l_note INTEGER,
    FOREIGN KEY (userID) REFERENCES user(ID) ON DELETE CASCADE
);


CREATE TABLE tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,    
    category TEXT NOT NULL,
    UNIQUE(label, category)             
);

CREATE TABLE exercise_tag (
    exerciseID INTEGER NOT NULL,
    tagID INTEGER NOT NULL,

    PRIMARY KEY (exerciseID, tagID),
    FOREIGN KEY (exerciseID) REFERENCES exercise(ID) ON DELETE CASCADE,
    FOREIGN KEY (tagID) REFERENCES tag(ID) ON DELETE CASCADE
);

CREATE TABLE favorite (
    userID INTEGER NOT NULL,
    exerciseID INTEGER NOT NULL,

    PRIMARY KEY (userID, exerciseID),
    FOREIGN KEY (userID) REFERENCES user(ID) ON DELETE CASCADE,
    FOREIGN KEY (exerciseID) REFERENCES exercise(ID) ON DELETE CASCADE
);
