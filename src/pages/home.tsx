export default function Home({ posts }: { posts: any[] }) {
  return (
    <div>
      <h1>Hello from home page</h1>
      <button onClick={() => alert()}>Click me!</button>
      <div>
        {posts.map((post) => (
          <div key={post.id}>
            <h2>{post.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getProps() {
  const response = await fetch("https://jsonplaceholder.typicode.com/todos");
  const posts = await response.json();

  return { props: { posts } };
}
