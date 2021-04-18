using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class line : MonoBehaviour
{
    public Vector2[] points;
    public float[] angles;
    public float[] lengths;
    public float[] dx;
    public float[] dy;

    public float zposConversionFactor = 1f;
    public int numSegments;
    public float[] cumulativelengths;
    public float cumulativeLength;

    public List<float> fontsizegates;
    // Start is called before the first frame update
    void Start()
    {

        LineRenderer line = gameObject.GetComponent<LineRenderer>();
        line.enabled = false;
        //line.useWorldSpace = true;
        int numPoints = line.positionCount;

        Vector3[] temppoints = new Vector3[line.positionCount];
        line.GetPositions(temppoints);

        cumulativeLength = 0f;
        Vector2 startpoint = new Vector2(-8f, 0f);
        numSegments = numPoints-1;

        points = new Vector2[2*numSegments];

        angles = new float[numSegments];
        lengths = new float[numSegments];
        dx = new float[numSegments];
        dy = new float[numSegments];
        cumulativelengths = new float[numSegments];

        for (int i = 0; i < numSegments*2; i+=2) {
            int index = i / 2;
            Debug.Log(temppoints[index]);
            points[i] = new Vector2(temppoints[index].x, temppoints[index].y);
            points[i+1] = new Vector2(temppoints[index+1].x, temppoints[index+1].y);

            Vector3 fixedp1 = new Vector3(points[i].x, points[i].y, 0f);
            Vector3 fixedp2 = new Vector3(points[i+1].x, points[i+1].y, 0f);
            Vector3 seg = (fixedp2 - fixedp1);
            float d = seg.magnitude;
            float a = Vector3.Angle(seg, new Vector3(1f, 0f, 0f));

            angles[index] = a; // Random.Range(-45f, 45f);
            lengths[index] = d; // Random.Range(4f, 6f);

            cumulativelengths[index] = cumulativeLength;
            cumulativeLength += d; // lengths[index];

            dx[index] = points[i+1].x - points[i].x;//lengths[index] *Mathf.Cos(Mathf.Deg2Rad * angles[index]);
            dy[index] = points[i + 1].y - points[i].y; //lengths[index] *Mathf.Sin(Mathf.Deg2Rad * angles[index]);
            /*
            points[i+1] = new Vector2(
                startpoint.x + dx[index],
                startpoint.y + dy[index]
                );

            Debug.Log(points[i]);
            Debug.Log(points[i + 1]);


            startpoint.x = points[i + 1].x;
            startpoint.y = points[i + 1].y;
            */
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
