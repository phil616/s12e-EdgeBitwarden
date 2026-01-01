import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MOCK_DB_PATH = path.join(process.cwd(), 'mock-kv.json');

function getDB() {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8'));
}

function saveDB(data: any) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2));
}

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const db = getDB();
  const value = db[key];
  
  if (!value) {
    return new NextResponse('Key not found', { status: 404 });
  }
  
  return NextResponse.json(value);
}

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const body = await request.json();
  const db = getDB();
  
  // POST: Create (error if exists)
  if (db[key]) {
      return new NextResponse('Key already exists', { status: 409 });
  }
  
  db[key] = body;
  saveDB(db);
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const body = await request.json();
  const db = getDB();
  
  // PUT: Update (error if not exists)
  if (!db[key]) {
      return new NextResponse('Key not found', { status: 404 });
  }
  
  db[key] = body;
  saveDB(db);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const db = getDB();
  
  if (!db[key]) {
      return new NextResponse('Key not found', { status: 404 });
  }
  
  delete db[key];
  saveDB(db);
  return NextResponse.json({ success: true });
}
