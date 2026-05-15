from flask import Flask, render_template

app = Flask(__name__)

# Home page
@app.route('/')
def home():
    books = [
        {"id": 101, "name": "Java Basics", "author": "James Gosling", "quantity": 5},
        {"id": 102, "name": "Python Programming", "author": "Guido van Rossum", "quantity": 3},
        {"id": 103, "name": "HTML and CSS", "author": "John Smith", "quantity": 4}
    ]
    
    return render_template("index.html", books=books)

if __name__ == '__main__':
    app.run(debug=True)
