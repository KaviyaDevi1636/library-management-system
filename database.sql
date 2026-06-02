CREATE DATABASE library_db;

USE library_db;

CREATE TABLE books (
    book_id INT PRIMARY KEY,
    book_name VARCHAR(100),
    author_name VARCHAR(100),
    quantity INT
);

INSERT INTO books VALUES
(101, 'Java Basics', 'James Gosling', 5),
(102, 'Python Programming', 'Guido van Rossum', 3),
(103, 'HTML and CSS', 'John Smith', 4);

SELECT * FROM books;
